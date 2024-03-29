import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	SolidType,
	SolidTypeTuple,
} from './package.js';
import type {ASTNodeItemType} from './ASTNodeItemType.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeTuple extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeTuple {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeTuple);
		return typ;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTypeTupleLiteral,
		override readonly children: readonly ASTNodeItemType[],
	) {
		super(start_node, {}, children);
	}
	protected override eval_do(): SolidType {
		return new SolidTypeTuple(this.children.map((c) => ({
			type:     c.val.eval(),
			optional: c.optional,
		})));
	}
}
