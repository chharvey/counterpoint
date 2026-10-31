import * as xjs from 'extrajs';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {validate_callable_class_name} from '../utils-private.ts';
import type * as AST_TYPE from '../type/index.ts';
import {Expression} from './Expression.ts';



export class Call extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Call {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Call);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'expression_compound'>,
		public readonly base:     Expression,
		public readonly typeargs: readonly AST_TYPE.Type[],
		public readonly exprargs: readonly Expression[],
	) {
		super(start_node, {}, [base, ...typeargs, ...exprargs]);
	}

	public override varCheck(): void {
		// NOTE: ignore var-checking `this.base` for now, as semantics is determined by syntax.
		// (`this.base.source` must be a `CallableClassName`)
		validate_callable_class_name(this.base.source);
		return xjs.Array.forEachAggregated([
			...this.typeargs,
			...this.exprargs,
		], (arg) => arg.varCheck());
	}

	public override typeCheck(): void {
		// NOTE: ignore type-checking `this.base` for now, as semantics is determined by syntax.
		// (`this.base.source` must be a `CallableClassName`)
		xjs.Array.forEachAggregated([
			...this.typeargs,
			...this.exprargs,
		], (arg) => arg.typeCheck());
		this.type(); // assert does not throw
	}
}
