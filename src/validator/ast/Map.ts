import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	TypeErrorNotAssignable,
} from '../../index.ts';
import {
	type NonemptyArray,
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {typecheck_assign} from './AstNode.ts';
import type {Case} from './Case.ts';
import {
	Expression,
	buildDeco,
	typeDeco,
} from './Expression.ts';
import {
	assignToDeco,
	CollectionLiteral,
} from './CollectionLiteral.ts';



class AstMap extends CollectionLiteral {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): AstMap {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, AstMap);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'map_literal', ['break']>,
		public override readonly children: Readonly<NonemptyArray<Case>>,
	) {
		super(start_node, children);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('`AstMap#build` not yet supported.');
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		if (this.children.some((c) => c.antecedent.type().isBottomType || c.consequent.type().isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.Map(
			TYPE.Union.all(this.children.map((c) => c.antecedent.type())),
			TYPE.Union.all(this.children.map((c) => c.consequent.type())),
			true,
		);
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const cases: ReadonlyMap<VALUE.Value | null, VALUE.Value | null> = new Map(this.children.map((c) => [
			c.antecedent.fold(),
			c.consequent.fold(),
		]));
		return ([...cases].some((c) => c[0] === null || c[1] === null))
			? null
			: new VALUE.Map(cases as ReadonlyMap<VALUE.Value, VALUE.Value>);
	}

	@assignToDeco
	public override assignTo(assignee: TYPE.Type): void {
		if (assignee instanceof TYPE.Map) {
			// better error reporting to check entry-by-entry instead of checking `this.type().typearg_{ant,con}`
			return xjs.Array.forEachAggregated(this.children, (case_) => (
				xjs.Array.forEachAggregated([case_.antecedent, case_.consequent], (expr, i) => (
					typecheck_assign(expr, [assignee.typearg_ant, assignee.typearg_con][i], expr)
				))
			));
		}
		throw new TypeErrorNotAssignable(this, assignee);
	}
}
export {AstMap as Map};
