import {
	type TypeEntry,
	TYPE,
	TypeErrorUnexpectedRef,
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
import type {ASTNodeItemType} from './ASTNodeItemType.js';
import {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeCollectionLiteral} from './ASTNodeTypeCollectionLiteral.js';



export class ASTNodeTypeTuple extends ASTNodeTypeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeTuple {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeTuple);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'type_tuple_literal', ['variable']>,
		public override readonly children: readonly ASTNodeItemType[],
		is_ref: boolean,
	) {
		super(start_node, children, is_ref);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		const entries: readonly TypeEntry[] = this.children.map((c) => {
			const itemtype: TYPE.Type = c.val.eval();
			if (!this.isRef && itemtype.isReference) {
				throw new TypeErrorUnexpectedRef(itemtype, c);
			}
			return {
				type:     itemtype,
				optional: c.optional,
			};
		});
		return (!this.isRef) ? new TYPE.TypeVect(entries) : new TYPE.TypeTuple(entries);
	}
}
