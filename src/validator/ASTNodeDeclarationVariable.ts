import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	AssignmentError01,
	TypeError03,
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	SolidObject,
	Int16,
	Float64,
	INST,
	Builder,
} from './package.js';
import type {ASTNodeType} from './ASTNodeType.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';
import type {Validator} from './Validator.js';
import {SymbolStructureVar} from './SymbolStructure.js';



export class ASTNodeDeclarationVariable extends ASTNodeStatement {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeDeclarationVariable {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeDeclarationVariable);
		return statement;
	}
	constructor (
		start_node: ParseNode,
		readonly unfixed: boolean,
		readonly variable: ASTNodeVariable,
		readonly type:     ASTNodeType,
		readonly value:    ASTNodeExpression,
	) {
		super(start_node, {unfixed}, [variable, type, value]);
	}
	override varCheck(validator: Validator): void {
		const variable: ASTNodeVariable = this.variable;
		if (validator.hasSymbol(variable.id)) {
			throw new AssignmentError01(variable);
		};
		this.type.varCheck(validator);
		this.value.varCheck(validator);
		validator.addSymbol(new SymbolStructureVar(
			variable.id,
			variable.line_index,
			variable.col_index,
			variable.source,
			this.unfixed,
			() => this.type.assess(validator),
			(validator.config.compilerOptions.constantFolding && !this.unfixed)
				? () => this.value.assess(validator)
				: null,
		));
	}
	override typeCheck(validator: Validator): void {
		this.type.typeCheck(validator);
		this.value.typeCheck(validator);
		const assignee_type: SolidType = this.type.assess(validator);
		const assigned_type: SolidType = this.value.type(validator);
		if (
			assigned_type.isSubtypeOf(assignee_type) ||
			validator.config.compilerOptions.intCoercion && assigned_type.isSubtypeOf(Int16) && Float64.isSubtypeOf(assignee_type)
		) {
		} else {
			throw new TypeError03(this, assignee_type, assigned_type)
		}
		return validator.getSymbolInfo(this.variable.id)?.assess();
	}
	override build(builder: Builder): INST.InstructionNone | INST.InstructionDeclareGlobal {
		const tofloat: boolean = this.type.assess(builder.validator).isSubtypeOf(Float64) || this.value.shouldFloat(builder.validator);
		const assess: SolidObject | null = this.variable.assess(builder.validator);
		return (builder.validator.config.compilerOptions.constantFolding && !this.unfixed && assess)
			? new INST.InstructionNone()
			: new INST.InstructionDeclareGlobal(this.variable.id, this.unfixed, this.value.build(builder, tofloat))
		;
	}
}
