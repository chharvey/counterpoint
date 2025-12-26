import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	TypeErrorNotAssignable,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import {
	ASTNodeExpression,
	buildDeco,
	typeDeco,
} from './Expression.ts';
import {
	assignToDeco,
	ASTNodeCollectionLiteral,
} from './CollectionLiteral.ts';



export class ASTNodeSet extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ASTNodeSet {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeSet);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'set_literal', ['break']>,
		public override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, children);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('`ASTNodeSet#build` not yet supported.');
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		if (this.children.some((c) => c.type().isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.Set(
			TYPE.Union.all(this.children.map((c) => c.type())),
			true,
		);
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const elements: readonly (VALUE.Value | null)[] = this.children.map((c) => c.fold());
		return (elements.includes(null))
			? null
			: new VALUE.Set(new Set(elements as VALUE.Value[]));
	}

	@assignToDeco
	public override assignTo(assignee: TYPE.Type): void {
		if (assignee instanceof TYPE.Set) {
			// better error reporting to check entry-by-entry instead of checking `this.type().typearg`
			return xjs.Array.forEachAggregated(this.children, (expr) => ASTNodeCP.typeCheckAssign(expr, assignee.typearg, expr));
		}
		throw new TypeErrorNotAssignable(this, assignee);
	}
}
