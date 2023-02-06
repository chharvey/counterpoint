import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	SolidType,
	Builder,
	AssignmentError01,
	forEachAggregated,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	SymbolStructureVar,
} from './package.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeType} from './ASTNodeType.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';
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
	override varCheck(): void {
		if (this.validator.hasSymbol(this.assignee.id)) {
			throw new AssignmentError01(this.assignee);
		};
		forEachAggregated([this.typenode, this.assigned], (c) => c.varCheck());
		this.validator.addSymbol(new SymbolStructureVar(this.assignee, this.unfixed));
	}
	override typeCheck(): void {
		this.assigned.typeCheck();
		const assignee_type: SolidType = this.typenode.eval();
		try {
			ASTNodeSolid.typeCheckAssignment(
				this.assigned.type(),
				assignee_type,
				this,
				this.validator,
			);
		} catch (err) {
			if (!(this.assigned instanceof ASTNodeCollectionLiteral && this.assigned.assignTo(assignee_type))) {
				throw err;
			}
		}
		const symbol: SymbolStructureVar | null = this.validator.getSymbolInfo(this.assignee.id) as SymbolStructureVar | null;
		if (symbol) {
			symbol.type = assignee_type;
			if (this.validator.config.compilerOptions.constantFolding && !symbol.type.hasMutable && !this.unfixed) {
				symbol.value = this.assigned.fold();
			}
		}
	}
	public override build(builder: Builder): binaryen.ExpressionRef {
		if (this.validator.config.compilerOptions.constantFolding && !this.unfixed && this.assignee.fold()) {
			return builder.module.nop();
		} else {
			const assignee_type: SolidType = this.typenode.eval();
			const local = builder.addLocal(this.assignee.id, assignee_type.binType())[0].getLocalInfo(this.assignee.id)!;
			return builder.module.local.set(local.index, ASTNodeStatement.coerceAssignment(
				builder.module,
				assignee_type,
				this.assigned.type(),
				this.assigned.build_bin(builder),
				this.validator.config.compilerOptions.intCoercion,
			));
		}
	}
}
