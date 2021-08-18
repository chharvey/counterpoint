import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
} from '../core/index.js';
import type {PARSER} from '../parser/index.js';
import {
	SolidType,
	SolidTypeTuple,
} from '../typer/index.js';
import type {ASTNodeItemType} from './ASTNodeItemType.js';
import {ASTNodeType} from './ASTNodeType.js';
import type {Validator} from './Validator.js';



export class ASTNodeTypeTuple extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeTuple {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeTuple);
		return typ;
	}
	constructor (
		start_node: PARSER.ParseNodeTypeTupleLiteral,
		override readonly children: readonly ASTNodeItemType[],
	) {
		super(start_node, {}, children);
	}
	protected override assess_do(validator: Validator): SolidType {
		return new SolidTypeTuple(this.children.map((c) => ({
			type:     c.value.assess(validator),
			optional: c.optional,
		})));
	}
}
