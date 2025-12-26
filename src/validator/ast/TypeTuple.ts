import {TYPE} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeItemType} from './ItemType.ts';
import {ASTNodeType} from './Type.ts';
import {ASTNodeTypeCollectionLiteral} from './TypeCollectionLiteral.ts';



export class ASTNodeTypeTuple extends ASTNodeTypeCollectionLiteral {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ASTNodeTypeTuple {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeTuple);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_tuple_literal'>,
		public override readonly children: readonly ASTNodeItemType[],
	) {
		super(start_node, children);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return new TYPE.Tuple(this.children.map((c) => ({
			type:     c.typevalue.eval(),
			optional: c.optional,
		})));
	}
}
