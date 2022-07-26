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
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeTuple {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeTuple);
		return typ;
	}
	constructor (
		start_node: SyntaxNodeType<'type_tuple_literal'>,
		override readonly children: readonly ASTNodeItemType[],
	) {
		super(start_node, {}, children);
	}
	protected override eval_do(): TYPE.SolidType {
		return new TYPE.SolidTypeTuple(this.children.map((c) => ({
			type:     c.val.eval(),
			optional: c.optional,
		})));
	}
}
