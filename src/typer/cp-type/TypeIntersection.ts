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
 * A type intersection of two types `T` and `U` is the type
 * that contains values either assignable to `T` *or* assignable to `U`.
 */
export class TypeIntersection extends Type implements Combinable {
	/**
	 * When accessing the *intersection* of tuple types `S` and `T`,
	 * the set of items available is the *union* of the set of items on `S` with the set of items on `T`.
	 * For any overlapping items, their type intersection is taken, as well as the conjunction of their optionality.
	 */
	private static intersectTuples(s: TypeTuple, t: TypeTuple): TypeTuple {
		const items: TypeEntry[] = [...s.invariants];
		t.invariants.forEach((typ, i) => {
			items[i] = s.invariants[i] ? {
				type:     s.invariants[i].type.intersect(typ.type),
				optional: s.invariants[i].optional && typ.optional,
			} : typ;
		});
		return new TypeTuple(items);
	}

	/**
	 * When accessing the *intersection* of record types `S` and `T`,
	 * the set of properties available is the *union* of the set of properties on `S` with the set of properties on `T`.
	 * For any overlapping properties, their type intersection is taken, as well as the conjunction of their optionality.
	 */
	private static intersectRecords(s: TypeRecord, t: TypeRecord): TypeRecord {
		const props = new Map<bigint, TypeEntry>([...s.invariants]);
		[...t.invariants].forEach(([id, typ]) => {
			props.set(id, s.invariants.has(id) ? {
				type:     s.invariants.get(id)!.type.intersect(typ.type),
				optional: s.invariants.get(id)!.optional && typ.optional,
			} : typ);
		});
		return new TypeRecord(props);
	}


	public readonly operands: readonly [Type, Type, ...readonly Type[]];
	public readonly left:     Type;
	public readonly right:    Type;

	/**
	 * Construct a new TypeIntersection object.
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
				(accum, next) => xjs.Set.intersection(accum, next.values, languageValuesIdentical),
				xjs.Set.intersection(operand0.values, operand1.values, languageValuesIdentical),
			),
		);
		this.operands = [operand0, operand1, ...operands];
		[this.left, this.right] = this.operands;
	}

	public override get isBottomType(): boolean {
		/* This could be bottom if the operands are disjoint. */
		return this.left.isBottomType || this.right.isBottomType || this.values.size === 0;
	}

	/*
	 * We can assert that this is never top because
	 * the only case in which it could be top is
	 * if both the left and the right are top,
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
		return `${ this.left } & ${ this.right }`;
	}

	public override includes(v: OBJ.Object): boolean {
		return this.left.includes(v) && this.right.includes(v);
	}

	@Type.intersectDeco
	public override intersect(t: Type): Type {
		/**
		 *     |  `C <: A --> (A  & B)  & C == B  & C`
		 *     |  `C <: B --> (A  & B)  & C == A  & C`
		 */
		return (
			t.isSubtypeOf(this.left)  ? this.right.intersect(t) :
			t.isSubtypeOf(this.right) ? this.left .intersect(t) :
			new TypeIntersection(this, t)
		);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		/** 3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C` */
		if (this.left.isSubtypeOf(t) || this.right.isSubtypeOf(t)) {
			return true;
		}
		/** 3-1 | `A  & B <: A  &&  A  & B <: B` */
		if (t.equals(this.left) || t.equals(this.right)) {
			return true;
		}
		return super.isSubtypeOf(t);
	}

	public override mutableOf(): TypeIntersection {
		return new TypeIntersection(this.left.mutableOf(), this.right.mutableOf());
	}

	public override immutableOf(): TypeIntersection {
		return new TypeIntersection(this.left.immutableOf(), this.right.immutableOf());
	}

	/** @implements Combinable */
	public combineTuplesOrRecords(): Type {
		return (
			(this.left instanceof TypeTuple  && this.right instanceof TypeTuple)  ? TypeIntersection.intersectTuples (this.left, this.right) :
			(this.left instanceof TypeRecord && this.right instanceof TypeRecord) ? TypeIntersection.intersectRecords(this.left, this.right) :
			this
		);
	}
}
