import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	SolidType,
	SolidObject,
	INST,
	Builder,
	AssignmentError01,
	SolidConfig,
	CONFIG_DEFAULT,
	SymbolStructureVar,
	SyntaxNodeType,
} from './package.js';
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
		start_node: SyntaxNodeType<'declaration_variable'>,
		readonly unfixed: boolean,
		readonly assignee: ASTNodeVariable,
		readonly typenode: ASTNodeType,
		readonly assigned: ASTNodeExpression,
	) {
		super(start_node, {unfixed}, [assignee, typenode, assigned]);
	}
	override varCheck(): void {
		if (this.validator.hasSymbol(this.assignee.id)) {
			throw new AssignmentError01(this.assignee);
		};
		xjs.Array.forEachAggregated([this.typenode, this.assigned], (c) => c.varCheck());
		this.validator.addSymbol(new SymbolStructureVar(this.assignee, this.unfixed));
	}
	override typeCheck(): void {
		this.assigned.typeCheck();
		ASTNodeSolid.typeCheckAssignment(
			this.typenode.eval(),
			this.assigned,
			this,
			this.validator,
		);
		const symbol: SymbolStructureVar | null = this.validator.getSymbolInfo(this.assignee.id) as SymbolStructureVar | null;
		if (symbol) {
			symbol.type = this.typenode.eval();
			if (this.validator.config.compilerOptions.constantFolding && !symbol.type.hasMutable && !this.unfixed) {
				symbol.value = this.assigned.fold();
			}
		}
	}
	override build(builder: Builder): INST.InstructionNone | INST.InstructionDeclareGlobal {
		const tofloat: boolean = this.typenode.eval().isSubtypeOf(SolidType.FLOAT) || this.assigned.shouldFloat();
		const value: SolidObject | null = this.assignee.fold();
		return (this.validator.config.compilerOptions.constantFolding && !this.unfixed && value)
			? new INST.InstructionNone()
			: new INST.InstructionDeclareGlobal(this.assignee.id, this.unfixed, this.assigned.build(builder, tofloat))
		;
	}
}
