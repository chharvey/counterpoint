import {
	OBJ,
	TYPE,
	type INST,
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
import type {SyntaxNodeFamily} from '../utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeTuple extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTuple {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeTuple);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'tuple_literal', ['variable']>,
		public override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, children);
	}

	public override shouldFloat(): boolean {
		throw 'ASTNodeTuple#shouldFloat not yet supported.';
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): INST.InstructionExpression {
		builder;
		throw 'ASTNodeTuple#build not yet supported.';
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
