import * as xjs from 'extrajs';
import {
	type EntryType,
	TYPE,
	AssignmentErrorDuplicateKey,
} from '../../index.ts';
import {
	type NonemptyArray,
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeKey} from './Key.ts';
import type {ASTNodePropertyType} from './PropertyType.ts';
import {ASTNodeType} from './Type.ts';
import {ASTNodeTypeCollectionLiteral} from './TypeCollectionLiteral.ts';



export class ASTNodeTypeRecord extends ASTNodeTypeCollectionLiteral {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ASTNodeTypeRecord {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeRecord);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_record_literal'>,
		public override readonly children: Readonly<NonemptyArray<ASTNodePropertyType>>,
	) {
		super(start_node, children);
	}

	public override varCheck(): void {
		const keys: ASTNodeKey[] = this.children.map((prop) => prop.key);
		xjs.Array.forEachAggregated(keys, (key, i) => {
			key.varCheck();
			if (keys.slice(0, i).find((k) => k.id === key.id)) {
				throw new AssignmentErrorDuplicateKey(key);
			}
		});
		return xjs.Array.forEachAggregated(this.children, (prop) => prop.typevalue.varCheck());
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return new TYPE.Record(new Map<bigint, EntryType>(this.children.map((c) => [
			c.key.id,
			{
				type:     c.typevalue.eval(),
				optional: c.optional,
			},
		])));
	}
}
