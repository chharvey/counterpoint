import type binaryen from 'binaryen';
import {
	OBJ,
	TYPE,
	type Builder,
} from '../../index.js';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeTuple extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTuple {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeTuple);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'tuple_literal'>,
		public override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, children);
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): binaryen.ExpressionRef {
		return builder.module.tuple.make(this.children.map((expr) => expr.build(builder)));
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		const items: readonly TYPE.Type[] = this.children.map((c) => {
			const itemtype: TYPE.Type = c.type();
			return itemtype;
		});
		return TYPE.TypeTuple.fromTypes(items);
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const items: readonly (OBJ.Object | null)[] = this.children.map((c) => c.fold());
		return (items.includes(null))
			? null
			: new OBJ.Tuple(items as OBJ.Object[]);
	}
}
