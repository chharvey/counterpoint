import * as xjs from 'extrajs';
import {AssignmentErrorDuplicateDeclaration} from '../../../index.ts';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {Serializable} from '../../../parser/index.ts';
import {SymbolSchemaVar} from '../../index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import type {Block} from '../Block.ts';
import type * as AST_TYPE from '../type/index.ts';
import type * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';
import {StatementBreakable} from './StatementBreakable.ts';



export class StatementIteration extends StatementBreakable {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementIteration {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementIteration);
		return statement;
	}

	public readonly id?: bigint;


	public constructor(
		start_node: SyntaxNodeFamily<'statement_iteration', ['return']>,
		public readonly assignee: Serializable | null,
		public readonly typenode: AST_TYPE.Type,
		public readonly iterable: EXPR.Expression,
		public readonly block:    Block,
	) {
		super(start_node, {}, [typenode, iterable, block]);
		if (this.assignee) {
			this.id = Validator.cookTokenIdentifier(this.assignee.source);
		}
	}


	public override varCheck(): void {
		// Do not call `super.varCheck()` as we want to VarCheck `this.block` at the end.
		xjs.Array.forEachAggregated([this.typenode, this.iterable], (c) => c.varCheck());
		if (this.assignee) {
			if (this.block.validator.hasSymbol(this.id!)) {
				throw new AssignmentErrorDuplicateDeclaration(this.assignee);
			}
			this.block.validator.addSymbol(new SymbolSchemaVar(
				this.id!,
				this.assignee,
				false, // because it should not be manually reassigned
				false, // because it won’t ever be nullish upon accessing
			));
		}
		this.block.varCheck(); // must come after assignee checks, because assignee may be referenced inside block
	}
}
