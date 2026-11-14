import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {Serializable} from '../../../parser/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import type * as AST_TYPE from '../type/index.ts';
import type * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class DeclarationVariable extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): DeclarationVariable {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, DeclarationVariable);
		return statement;
	}


	public readonly id?: bigint;


	public constructor(
		start_node: SyntaxNodeFamily<'declaration_variable', ['break', 'return']>,
		public readonly writable: boolean,
		public readonly assignee: Serializable | null,
		public readonly typenode: AST_TYPE.Type | null,
		public readonly assigned: EXPR.Expression | null,
	) {
		super(
			start_node,
			{writable},
			[
				...(typenode ? [typenode] : []),
				...(assigned ? [assigned] : []),
			],
		);
		if (this.assignee) {
			this.id = Validator.cookTokenIdentifier(this.assignee.source);
		}
	}
}
