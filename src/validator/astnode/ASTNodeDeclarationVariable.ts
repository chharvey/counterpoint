import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	AssignmentError01,
	SolidConfig,
	CONFIG_DEFAULT,
	SolidObject,
	Float64,
	INST,
	Builder,
	Validator,
	SymbolStructureVar,
} from './package.js';
import {forEachAggregated} from './utils-private.js';
import type {ASTNodeType} from './ASTNodeType.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeDeclarationVariable extends ASTNodeStatement {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeDeclarationVariable {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeDeclarationVariable);
		return statement;
	}
	constructor (
		start_node: ParseNode,
		readonly unfixed: boolean,
		readonly assignee: ASTNodeVariable,
		readonly typenode: ASTNodeType,
		readonly assigned: ASTNodeExpression,
	) {
		super(start_node, {unfixed}, [assignee, typenode, assigned]);
	}
	override varCheck(validator: Validator): void {
		if (validator.hasSymbol(this.assignee.id)) {
			throw new AssignmentError01(this.assignee);
		};
		forEachAggregated([this.typenode, this.assigned], (c) => c.varCheck(validator));
		validator.addSymbol(new SymbolStructureVar(
			this.assignee,
			this.unfixed,
			() => this.typenode.eval(validator),
			(validator.config.compilerOptions.constantFolding && !this.unfixed)
				? () => this.assigned.fold(validator)
				: null,
		));
	}
	override typeCheck(validator: Validator): void {
		this.assigned.typeCheck(validator);
		this.typeCheckAssignment(
			this.typenode.eval(validator),
			this.assigned.type(validator),
			validator,
		);
		return validator.getSymbolInfo(this.assignee.id)?.assess();
	}
	override build(builder: Builder): INST.InstructionNone | INST.InstructionDeclareGlobal {
		const tofloat: boolean = this.typenode.eval(builder.validator).isSubtypeOf(Float64) || this.assigned.shouldFloat(builder.validator);
		const value: SolidObject | null = this.assignee.fold(builder.validator);
		return (builder.validator.config.compilerOptions.constantFolding && !this.unfixed && value)
			? new INST.InstructionNone()
			: new INST.InstructionDeclareGlobal(this.assignee.id, this.unfixed, this.assigned.build(builder, tofloat))
		;
	}
}
