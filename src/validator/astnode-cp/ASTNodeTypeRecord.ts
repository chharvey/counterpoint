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
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeKey} from './ASTNodeKey.ts';
import type {ASTNodePropertyType} from './ASTNodePropertyType.ts';
import {ASTNodeType} from './ASTNodeType.ts';
import {ASTNodeTypeCollectionLiteral} from './ASTNodeTypeCollectionLiteral.ts';



export class ASTNodeTypeRecord extends ASTNodeTypeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeRecord {
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
		super.varCheck();
		const keys: ASTNodeKey[] = this.children.map((proptype) => proptype.key);
		xjs.Array.forEachAggregated(keys.map((key) => key.id), (id, i, ids) => {
			if (ids.slice(0, i).includes(id)) {
				throw new AssignmentErrorDuplicateKey(keys[i]);
			}
		});
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		const entries: ReadonlyMap<bigint, EntryType> = new Map<bigint, EntryType>(this.children.map((c) => {
			const valuetype: TYPE.Type = c.val.eval();
			return [
				c.key.id,
				{
					type:     valuetype,
					optional: c.optional,
				},
			];
		}));
		return new TYPE.Record(entries);
	}
}
