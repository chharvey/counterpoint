import * as assert from 'assert';
import {
	TYPE,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import type {ASTNodeItemType} from './ASTNodeItemType.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeTuple extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeTuple {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeTuple);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_tuple_literal'>,
		public override readonly children: readonly ASTNodeItemType[],
	) {
		super(start_node, {}, children);
	}

	protected override eval_do(): TYPE.Type {
		return new TYPE.TypeTuple(this.children.map((c) => ({
			type:     c.val.eval(),
			optional: c.optional,
		})));
	}
}
