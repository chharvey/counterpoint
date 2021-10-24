import * as assert from 'assert';
import {
	SolidType,
	SolidObject,
	INST,
	Builder,
	AssignmentError01,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	Validator,
	SymbolStructureVar,
} from './package.js';
import {forEachAggregated} from './utils-private.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
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
		validator.addSymbol(new SymbolStructureVar(this.assignee, this.unfixed));
	}
	override typeCheck(validator: Validator): void {
		this.assigned.typeCheck(validator);
		ASTNodeSolid.typeCheckAssignment(
			this.typenode.eval(validator),
			this.assigned,
			this,
			validator,
		);
		const symbol: SymbolStructureVar | null = validator.getSymbolInfo(this.assignee.id) as SymbolStructureVar | null;
		if (symbol) {
			symbol.type = this.typenode.eval(validator);
			if (validator.config.compilerOptions.constantFolding && !symbol.type.hasMutable && !this.unfixed) {
				symbol.value = this.assigned.fold(validator);
			}
		}
	}
	override build(builder: Builder): INST.InstructionNone | INST.InstructionDeclareGlobal {
		const tofloat: boolean = this.typenode.eval(builder.validator).isSubtypeOf(SolidType.FLOAT) || this.assigned.shouldFloat(builder.validator);
		const value: SolidObject | null = this.assignee.fold(builder.validator);
		return (builder.validator.config.compilerOptions.constantFolding && !this.unfixed && value)
			? new INST.InstructionNone()
			: new INST.InstructionDeclareGlobal(this.assignee.id, this.unfixed, this.assigned.build(builder, tofloat))
		;
	}
}
