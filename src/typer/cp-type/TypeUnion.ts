import * as assert from 'assert';
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
		return this.operands.some((s) => s.isReference);
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.operands.some((s) => s.hasMutable);
	}

	@Type.toStringDeco
	public override toString(): string {
		return this.operands.join(' | ');
	}

	public override includes(v: OBJ.Object): boolean {
		return this.operands.some((s) => s.includes(v));
	}

	@Type.intersectDeco
	public override intersect(t: Type): Type {
		/** 2-6 | `A \| (B  & C) == (A \| B)  & (A \| C)` */
		if (t instanceof TypeUnion) {
			const this_left:  Type = this.operands[0];
			const this_right: Type = this.operands[1];
			const that_left:  Type = t.operands[0];
			const that_right: Type = t.operands[1];
			switch (true) {
				/**     |  `(A \| B)  & (A \| C) == A \| (B  & C)` */
				case this_left.equals(that_left): {
					return this_left.union(this_right.intersect(that_right));
				}
				/**     |  `(A \| B)  & (C \| A) == A \| (B  & C)` */
				case this_left.equals(that_right): {
					return this_left.union(this_right.intersect(that_left));
				}
				/**     |  `(B \| A)  & (A \| C) == A \| (B  & C)` */
				case this_right.equals(that_left): {
					return this_right.union(this_left.intersect(that_right));
				}
				/**     |  `(B \| A)  & (C \| A) == A \| (B  & C)` */
				case this_right.equals(that_right): {
					return this_right.union(this_left.intersect(that_left));
				}
			}
		}
		/**
		 * 2-5 | `A  & (B \| C) == (A  & B) \| (A  & C)`
		 *     |  (B \| C)  & A == (B  & A) \| (C  & A)
		 */
		return Type.unionAll(this.operands.map((s) => s.intersect(t)));
	}

	@Type.unionDeco
	public override union(t: Type): Type {
		/**
		 *     |  `A <: C --> (A \| B) \| C == B \| C`
		 *     |  `B <: C --> (A \| B) \| C == A \| C`
		 */
		const filtered_operands = this.operands.filter((s) => !s.isSubtypeOf(t));
		if (filtered_operands.length < this.operands.length) {
			if (filtered_operands.length >= 2) {
				return new TypeUnion(filtered_operands[0], filtered_operands[1], ...filtered_operands.slice(2)).union(t);
			} else if (filtered_operands.length) {
				return filtered_operands[0].union(t);
			} else {
				/* 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C` */
				assert.ok(this.isSubtypeOf(t), `Expected ${ this } to be a subtype of ${ t }.`);
				/* 3-4 | `A <: B  <->  A \| B == B` */
				return t;
			}
		} else {
			return new TypeUnion(this, t);
		}
	}

	@Type.subtractDeco
	public override subtract(t: Type): Type {
		/** 4-4 | `(A \| B) - C == (A - C) \| (B - C)` */
		return Type.unionAll(this.operands.map((s) => s.subtract(t)));
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		/** 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C` */
		return this.operands.every((s) => s.isSubtypeOf(t));
	}

	public override mutableOf(): TypeUnion {
		return new TypeUnion(...this.operands.map((s) => s.mutableOf()) as [Type, Type, ...Type[]]);
	}

	public override immutableOf(): TypeUnion {
		return new TypeUnion(...this.operands.map((s) => s.immutableOf()) as [Type, Type, ...Type[]]);
	}

	/** @implements Combinable */
	public combineTuplesOrRecords(): Type {
		return (
			this.operands.every((s) => s instanceof TypeTuple)  ? (this.operands as readonly [TypeTuple,  TypeTuple,  ...readonly TypeTuple[]]) .reduce((a, b) => TypeUnion.unionTuples (a, b)) :
			this.operands.every((s) => s instanceof TypeRecord) ? (this.operands as readonly [TypeRecord, TypeRecord, ...readonly TypeRecord[]]).reduce((a, b) => TypeUnion.unionRecords(a, b)) :
			this
		);
	}
}
