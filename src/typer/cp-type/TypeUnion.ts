import * as xjs from 'extrajs';
import {strictEqual} from '../../lib/index.js';
import type {TypeEntry} from '../utils-public.js';
import {languageValuesIdentical} from '../utils-private.js';
import type * as OBJ from '../cp-object/index.js';
import {
	TypeTuple,
	TypeRecord,
} from './index.js';
import {
	Type,
	type Combinable,
} from './Type.js';



/**
 * A type union of two types `T` and `U` is the type
 * that contains values both assignable to `T` *and* assignable to `U`.
 */
export class TypeUnion extends Type implements Combinable {
	/**
	 * When accessing the *union* of tuple types `S` and `T`,
	 * the set of items available is the *intersection* of the set of items on `S` with the set of items on `T`.
	 * For any overlapping items, their type union is taken, as well as the disjunction of their optionality.
	 */
	private static unionTuples(s: TypeTuple, t: TypeTuple): TypeTuple {
		const items: TypeEntry[] = [];
		t.invariants.forEach((typ, i) => {
			if (s.invariants[i]) {
				items[i] = {
					type:     s.invariants[i].type.union(typ.type),
					optional: s.invariants[i].optional || typ.optional,
				};
			}
		});
		return new TypeTuple(items);
	}

	/**
	 * When accessing the *union* of record types `S` and `T`,
	 * the set of properties available is the *intersection* of the set of properties on `S` with the set of properties on `T`.
	 * For any overlapping properties, their type union is taken, as well as the disjunction of their optionality.
	 */
	private static unionRecords(s: TypeRecord, t: TypeRecord): TypeRecord {
		const props = new Map<bigint, TypeEntry>();
		[...t.invariants].forEach(([id, typ]) => {
			if (s.invariants.has(id)) {
				props.set(id, {
					type:     s.invariants.get(id)!.type.union(typ.type),
					optional: s.invariants.get(id)!.optional || typ.optional,
				});
			}
		});
		return new TypeRecord(props);
	}


	public readonly operands: readonly [Type, Type, ...readonly Type[]];
	public readonly left:     Type;
	public readonly right:    Type;

	/**
	 * Construct a new TypeUnion object.
	 * @param operand0 the first type
	 * @param operand1 the second type
	 */
	public constructor(
		operand0:    Type,
		operand1:    Type,
		...operands: readonly Type[]
	) {
		super(
			false,
			operands.reduce(
				(accum, next) => xjs.Set.union(accum, next.values, languageValuesIdentical),
				xjs.Set.union(operand0.values, operand1.values, languageValuesIdentical),
			),
		);
		this.operands = [operand0, operand1, ...operands];
		[this.left, this.right] = this.operands;
	}

	/*
	 * We can assert that this is never bottom because
	 * the only case in which it could be bottom is
	 * if both the left and the right are bottom,
	 * which is impossible because the algorithm would have already produced the `never` type.
	 */

	/*
	 * We can assert that this is never top because
	 * the only case in which it could be top is
	 * if either the left or the right is top,
	 * which is impossible because the algorithm would have already produced the `unknown` type.
	 */

	public override get isReference(): boolean {
		return this.left.isReference || this.right.isReference;
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.left.hasMutable || this.right.hasMutable;
	}

	@Type.toStringDeco
	public override toString(): string {
		return `${ this.left } | ${ this.right }`;
	}

	public override includes(v: OBJ.Object): boolean {
		return this.left.includes(v) || this.right.includes(v);
	}

	@Type.intersectDeco
	public override intersect(t: Type): Type {
		/** 2-6 | `A \| (B  & C) == (A \| B)  & (A \| C)` */
		if (t instanceof TypeUnion) {
			switch (true) {
				/**     |  `(A \| B)  & (A \| C) == A \| (B  & C)` */
				case this.left.equals(t.left): {
					return this.left.union(this.right.intersect(t.right));
				}
				/**     |  `(A \| B)  & (C \| A) == A \| (B  & C)` */
				case this.left.equals(t.right): {
					return this.left.union(this.right.intersect(t.left));
				}
				/**     |  `(B \| A)  & (A \| C) == A \| (B  & C)` */
				case this.right.equals(t.left): {
					return this.right.union(this.left.intersect(t.right));
				}
				/**     |  `(B \| A)  & (C \| A) == A \| (B  & C)` */
				case this.right.equals(t.right): {
					return this.right.union(this.left.intersect(t.left));
				}
			}
		}
		/**
		 * 2-5 | `A  & (B \| C) == (A  & B) \| (A  & C)`
		 *     |  (B \| C)  & A == (B  & A) \| (C  & A)
		 */
		return this.left.intersect(t).union(this.right.intersect(t));
	}

	@Type.unionDeco
	public override union(t: Type): Type {
		/**
		 *     |  `A <: C --> (A \| B) \| C == B \| C`
		 *     |  `B <: C --> (A \| B) \| C == A \| C`
		 */
		return (
			this.left .isSubtypeOf(t) ? this.right.union(t) :
			this.right.isSubtypeOf(t) ? this.left .union(t) :
			new TypeUnion(this, t)
		);
	}

	@Type.subtractDeco
	public override subtract(t: Type): Type {
		/** 4-4 | `(A \| B) - C == (A - C) \| (B - C)` */
		return this.left.subtract(t).union(this.right.subtract(t));
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		/** 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C` */
		return this.left.isSubtypeOf(t) && this.right.isSubtypeOf(t);
	}

	public override mutableOf(): TypeUnion {
		return new TypeUnion(this.left.mutableOf(), this.right.mutableOf());
	}

	public override immutableOf(): TypeUnion {
		return new TypeUnion(this.left.immutableOf(), this.right.immutableOf());
	}

	/** @implements Combinable */
	public combineTuplesOrRecords(): Type {
		return (
			(this.left instanceof TypeTuple  && this.right instanceof TypeTuple)  ? TypeUnion.unionTuples (this.left, this.right)  :
			(this.left instanceof TypeRecord && this.right instanceof TypeRecord) ? TypeUnion.unionRecords(this.left, this.right) :
			this
		);
	}
}
