import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {Serializable} from '../../../parser/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import type * as AST_TYPE from '../type/index.ts';
import {Statement} from './Statement.ts';



export class DeclarationType extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): DeclarationType {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, DeclarationType);
		return statement;
	}


	public readonly id?: bigint;


	public constructor(
		start_node: SyntaxNodeType<'declaration_type'>,
		public readonly assignee: Serializable | null,
		public readonly assigned: AST_TYPE.Type,
	) {
		super(start_node, {}, [assigned]);
		if (this.assignee) {
			this.id = Validator.cookTokenIdentifier(this.assignee.source);
		}
	}
}
