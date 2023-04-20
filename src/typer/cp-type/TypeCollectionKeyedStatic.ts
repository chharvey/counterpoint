import {TypeErrorNoEntry} from '../../index.js';
import {
	type IntRange,
	throw_expression,
} from '../../lib/index.js';
import type {
	ValidAccessOperator,
	AST,
} from '../../validator/index.js';
import type {TypeEntry} from '../utils-public.js';
import type * as OBJ from '../cp-object/index.js';
import {updateAccessedStaticType} from './utils-private.js';
import {Type} from './Type.js';



/**
 * Known subclasses:
 * - TypeRecord
 * - TypeStruct
 */
export class TypeCollectionKeyedStatic extends Type {
	public override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeCollectionKeyedStatic object.
	 * @param invariants a map of this type’s property ids along with their associated types
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariants: ReadonlyMap<bigint, TypeEntry>,
		is_mutable:                 boolean,
		initial_values:             ReadonlySet<OBJ.Object>,
	) {
		super(is_mutable, initial_values);
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || [...this.invariants.values()].some((t) => t.type.hasMutable);
	}

	/**
	 * The possible number of items in this static keyed collection type.
	 * @final
	 */
	public get count(): IntRange {
		return [
			BigInt([...this.invariants.values()].filter((val) => !val.optional).length),
			BigInt(this.invariants.size) + 1n,
		];
	}

	public override toString(): string {
		return `[${ [...this.invariants].map(([key, value]) => `${ key }${ value.optional ? '?:' : ':' } ${ value.type }`).join(', ') }]`;
	}

	/** @final */
	public get(key: bigint, access_kind: ValidAccessOperator, accessor: AST.ASTNodeKey): Type {
		return updateAccessedStaticType(
			((this.invariants.has(key))
				? this.invariants.get(key)!
				: throw_expression(new TypeErrorNoEntry('property', this, accessor))
			),
			access_kind,
		);
	}

	/** @final */
	public valueTypes(): Type {
		return Type.unionAll([...this.invariants.values()].map((t) => t.type));
	}
}
