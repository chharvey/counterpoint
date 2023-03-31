import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	type TYPE,
	type Builder,
	AssignmentError01,
} from '../../index.js';
import {assert_instanceof} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import {SymbolStructureVar} from '../index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeType} from './ASTNodeType.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeDeclarationVariable extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDeclarationVariable {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeDeclarationVariable);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'declaration_variable'>,
		public  readonly unfixed:  boolean,
		private readonly assignee: ASTNodeVariable,
		private readonly typenode: ASTNodeType,
		public readonly assigned:  ASTNodeExpression,
	) {
		super(start_node, {unfixed}, [assignee, typenode, assigned]);
	}

	public override varCheck(): void {
		if (this.validator.hasSymbol(this.assignee.id)) {
			throw new AssignmentError01(this.assignee);
		}
		xjs.Array.forEachAggregated([this.typenode, this.assigned], (c) => c.varCheck());
		this.validator.addSymbol(new SymbolStructureVar(this.assignee, this.unfixed));
	}

	public override typeCheck(): void {
		this.assigned.typeCheck();
		const assignee_type: TYPE.Type = this.typenode.eval();
		try {
			ASTNodeCP.typeCheckAssignment(
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
			const assignee_type: TYPE.Type = this.typenode.eval();
			const local = builder.addLocal(this.assignee.id, assignee_type.binType())[0].getLocalInfo(this.assignee.id)!;
			return builder.module.local.set(local.index, ASTNodeStatement.coerceAssignment(
				builder.module,
				assignee_type,
				this.assigned.type(),
				this.assigned.build(builder),
				this.validator.config.compilerOptions.intCoercion,
			));
		}
	}
}
