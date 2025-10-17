import {
	type EntryType,
	TYPE,
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
import type {ASTNodeItemType} from './ASTNodeItemType.ts';
import {ASTNodeType} from './ASTNodeType.ts';
import {ASTNodeTypeCollectionLiteral} from './ASTNodeTypeCollectionLiteral.ts';



export class ASTNodeTypeTuple extends ASTNodeTypeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeTuple {
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
		const entries: readonly EntryType[] = this.children.map((c) => {
			const itemtype: TYPE.Type = c.val.eval();
			return {
				type:     itemtype,
				optional: c.optional,
			};
		});
		return new TYPE.Tuple(entries);
	}
}
