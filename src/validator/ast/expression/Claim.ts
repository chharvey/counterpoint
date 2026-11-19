import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type * as AST_TYPE from '../type/index.ts';
import {Expression} from './Expression.ts';




export class Claim extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Claim {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Claim);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'expression_cast'>,
		public readonly force:        boolean,
		public readonly operand:      Expression,
		public readonly claimed_type: AST_TYPE.Type,
	) {
		super(start_node, {force}, [operand, claimed_type]);
	}
}
