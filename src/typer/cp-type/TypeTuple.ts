import * as assert from 'assert';
import {strictEqual} from '../../lib/index.js';
import type {TypeEntry} from '../utils-public.js';
import * as OBJ from '../cp-object/index.js';
import {OBJ as TYPE_OBJ} from './index.js';
import {Type} from './Type.js';
import {TypeCollectionIndexedStatic} from './TypeCollectionIndexedStatic.js';



export class TypeTuple extends TypeCollectionIndexedStatic {
	/**
	 * Construct a new TypeTuple from type items, assuming each item is required.
	 * @param types the types of the tuple
	 * @param is_mutable is the tuple type mutable?
	 * @return a new tuple type with the provided items
	 */
	public static fromTypes(types: readonly Type[] = [], is_mutable: boolean = false): TypeTuple {
		return new TypeTuple(types.map((t) => ({
			type:     t,
			optional: false,
		})), is_mutable);
	}


	/**
	 * Construct a new TypeTuple object.
	 * @param invariants this type’s item types
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		invariants: readonly TypeEntry[] = [],
		is_mutable: boolean              = false,
	) {
		super(invariants, is_mutable, new Set([new OBJ.Tuple()]));
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }[${ super.toString() }]`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Tuple && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.equals(TYPE_OBJ) || (
			t instanceof TypeTuple
			&& this.count[0] >= t.count[0]
			&& (!t.isMutable || this.isMutable)
			&& t.invariants.every((thattype, i) => {
				/* eslint-disable @typescript-eslint/no-unnecessary-condition */
				const thistype: TypeEntry | undefined = this.invariants[i];
				if (!thattype.optional) {
					/* NOTE: We can assert `thistype` exists and is not optional because of tuple type item ordering.
						We cannot do so with record types since properties are not ordered. */
					assert.strictEqual(thistype?.optional, false, `${ thistype } should exist and not be optional.`);
				}
				return !thistype || ((t.isMutable)
					? thistype.type.equals(thattype.type)      // Invariance for mutable tuples: `A == B --> mutable Tuple.<A> <: mutable Tuple.<B>`.
					: thistype.type.isSubtypeOf(thattype.type) // Covariance for immutable tuples: `A <: B --> Tuple.<A> <: Tuple.<B>`.
				);
				/* eslint-enable @typescript-eslint/no-unnecessary-condition */
			})
		);
	}

	public override mutableOf(): TypeTuple {
		return new TypeTuple(this.invariants, true);
	}

	public override immutableOf(): TypeTuple {
		return new TypeTuple(this.invariants, false);
	}

	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of items on `S` with the set of items on `T`.
	 * For any overlapping items, their type intersection is taken.
	 */
	public intersectWithTuple(t: TypeTuple): TypeTuple {
		const items: TypeEntry[] = [...this.invariants];
		[...t.invariants].forEach((typ, i) => {
			items[i] = this.invariants[i] ? {
				type:     this.invariants[i].type.intersect(typ.type),
				optional: this.invariants[i].optional && typ.optional,
			} : typ;
		});
		return new TypeTuple(items);
	}

	/**
	 * The *union* of types `S` and `T` is the *intersection* of the set of items on `S` with the set of items on `T`.
	 * For any overlapping items, their type union is taken.
	 */
	public unionWithTuple(t: TypeTuple): TypeTuple {
		const items: TypeEntry[] = [];
		t.invariants.forEach((typ, i) => {
			if (this.invariants[i]) {
				items[i] = {
					type:     this.invariants[i].type.union(typ.type),
					optional: this.invariants[i].optional || typ.optional,
				};
			}
		});
		return new TypeTuple(items);
	}
}
