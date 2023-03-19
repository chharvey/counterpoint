import * as assert from 'assert';
import {TYPE} from '../../index.js';
import {memoizeMethod} from '../../lib/index.js';
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
		assert.ok(typ instanceof ASTNodeTypeTuple);
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
		return new TYPE.TypeTuple(this.children.map((c) => ({
			type:     c.val.eval(),
			optional: c.optional,
		})));
	}
}
