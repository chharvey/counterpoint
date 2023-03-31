import * as xjs from 'extrajs';
import {
	type TypeEntry,
	TYPE,
	AssignmentErrorDuplicateKey,
	TypeErrorUnexpectedRef,
} from '../../index.js';
import {
	type NonemptyArray,
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeFamily} from '../utils-private.js';
import type {ASTNodeKey} from './ASTNodeKey.js';
import type {ASTNodePropertyType} from './ASTNodePropertyType.js';
import {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeCollectionLiteral} from './ASTNodeTypeCollectionLiteral.js';



export class ASTNodeTypeRecord extends ASTNodeTypeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeRecord {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeRecord);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'type_record_literal', ['variable']>,
		public override readonly children: Readonly<NonemptyArray<ASTNodePropertyType>>,
		is_ref: boolean,
	) {
		super(start_node, children, is_ref);
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
		const entries: ReadonlyMap<bigint, TypeEntry> = new Map<bigint, TypeEntry>(this.children.map((c) => {
			const valuetype: TYPE.Type = c.val.eval();
			if (!this.isRef && valuetype.isReference) {
				throw new TypeErrorUnexpectedRef(valuetype, c);
			}
			return [
				c.key.id,
				{
					type:     valuetype,
					optional: c.optional,
				},
			];
		}));
		return (!this.isRef) ? new TYPE.TypeStruct(entries) : new TYPE.TypeRecord(entries);
	}
}
