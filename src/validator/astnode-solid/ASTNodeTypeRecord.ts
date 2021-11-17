import * as assert from 'assert';
import {
	NonemptyArray,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	SolidType,
	SolidTypeRecord,
	Validator,
} from './package.js';
import type {ASTNodePropertyType} from './ASTNodePropertyType.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeRecord extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeRecord {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeRecord);
		return typ;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTypeRecordLiteral,
		override readonly children: Readonly<NonemptyArray<ASTNodePropertyType>>,
	) {
		super(start_node, {}, children);
	}
	protected override eval_do(validator: Validator): SolidType {
		return new SolidTypeRecord(new Map(this.children.map((c) => [
			c.key.id,
			{
				type:     c.val.eval(validator),
				optional: c.optional,
			},
		])));
	}
}
