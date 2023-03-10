import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	TYPE,
	AssignmentError02,
} from '../../index.js';
import {
	NonemptyArray,
	memoizeMethod,
} from '../../lib/index.js';
import {
	CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import type {ASTNodeKey} from './ASTNodeKey.js';
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

	public override varCheck(): void {
		super.varCheck();
		const keys: ASTNodeKey[] = this.children.map((proptype) => proptype.key);
		xjs.Array.forEachAggregated(keys.map((key) => key.id), (id, i, ids) => {
			if (ids.slice(0, i).includes(id)) {
				throw new AssignmentError02(keys[i]);
			}
		});
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
