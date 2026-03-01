import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	type Optimizer,
	IR,
	TypeErrorNotAssignable,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import {
	buildDeco,
	typeDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';
import {
	assignToDeco,
	ASTNodeCollectionLiteral,
} from './ASTNodeCollectionLiteral.ts';



export class ASTNodeSet extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeSet {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeSet);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'set_literal'>,
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
		return new TYPE.Set(
			TYPE.Union.all(this.children.map((c) => c.type())),
			true,
		);
	}

	@memoizeMethod
	public override lower(optimizer: Optimizer): IR.Value {
		return new IR.CollectionLinearNew(IR.TypeName.SET, this.children.map((c) => c.lower(optimizer).asTac(optimizer)), IR.TypeName.SET);
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
		throw new TypeErrorNotAssignable(this.type(), assignee, this);
	}
}
