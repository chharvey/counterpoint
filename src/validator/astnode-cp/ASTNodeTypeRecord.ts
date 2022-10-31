import * as assert from 'assert';
import {
	TYPE,
	NonemptyArray,
	memoizeMethod,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import type {ASTNodePropertyType} from './ASTNodePropertyType.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeRecord extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeRecord {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeRecord);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_record_literal'>,
		public override readonly children: Readonly<NonemptyArray<ASTNodePropertyType>>,
	) {
		super(start_node, {}, children);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return new TYPE.TypeRecord(new Map(this.children.map((c) => [
			c.key.id,
			{
				type:     c.val.eval(),
				optional: c.optional,
			},
		])));
	}
}
