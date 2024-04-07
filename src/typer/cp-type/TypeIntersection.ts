import * as assert from 'assert';
import * as xjs from 'extrajs';
import {strictEqual} from '../../lib/index.js';
import type {TypeEntry} from '../utils-public.js';
import {languageValuesIdentical} from '../utils-private.js';
import type * as OBJ from '../cp-object/index.js';
import {
	TypeTuple,
	TypeRecord,
	NEVER,
} from './index.js';
import {Type} from './Type.js';
import {Combinable} from './Combinable.js';



/**
 * A type intersection of two types `T` and `U` is the type
 * that contains values either assignable to `T` *or* assignable to `U`.
 */
export class TypeIntersection extends Combinable {
	/**
	 * Intersect all the given types.
	 * If an empty array is given, return type `never`.
	 * @param types the types to intersect
	 * @returns the intersection
	 */
	public static all(types: readonly Type[]): Type;
	public static all(...types: readonly Type[]): Type;
	public static all(arg0?: readonly Type[] | Type, ...args: readonly Type[]): Type {
		return arg0 instanceof Array
			? TypeIntersection.all(...arg0)
			: arg0
				? [arg0, ...args].reduce((a, b) => a.intersect(b))
				: NEVER;
	}

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
			operands.reduce(
				(accum, next) => xjs.Set.intersection(accum, next.values, languageValuesIdentical),
				xjs.Set.intersection(operand0.values, operand1.values, languageValuesIdentical),
			),
			[
				...(operand0 instanceof TypeIntersection ? operand0.operands : [operand0] as const),
				...(operand1 instanceof TypeIntersection ? operand1.operands : [operand1] as const),
				...operands,
			],
		);
	}

	public override get isBottomType(): boolean {
		/* This could be bottom if the operands are disjoint. */
		return this.operands.some((s) => s.isBottomType) || this.values.size === 0;
	}

	/*
	 * We can assert that this is never top because
	 * the only case in which it could be top is
	 * if both the left and the right are top,
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
		return this.operands.join(' & ');
	}

	public override includes(v: OBJ.Object): boolean {
		return this.operands.every((s) => s.includes(v));
	}

	@Type.intersectDeco
	public override intersect(t: Type): Type {
		/**
		 * 3-9 | `C <: A --> (A  & B)  & C == B  & C`
		 *     | `C <: B --> (A  & B)  & C == A  & C`
		 */
		const filtered_operands = this.operands.filter((s) => !t.isSubtypeOf(s));
		if (filtered_operands.length < this.operands.length) {
			if (filtered_operands.length >= 2) {
				return new TypeIntersection(filtered_operands[0], filtered_operands[1], ...filtered_operands.slice(2)).intersect(t);
			} else if (filtered_operands.length) {
				return filtered_operands[0].intersect(t);
			} else {
				/* 3-5 | `A <: C    &&  A <: D  <->  A <: C  & D` */
				assert.ok(t.isSubtypeOf(this), `Expected ${ t } to be a subtype of ${ this }.`);
				/* 3-3 | `A <: B  <->  A  & B == A` */
				return t;
			}
		} else {
			return new TypeIntersection(this, t);
		}
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		/** 3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C` */
		if (this.operands.some((s) => s.isSubtypeOf(t))) {
			return true;
		}
		/** 3-1 | `A  & B <: A  &&  A  & B <: B` */
		if (this.operands.some((s) => s.equals(t))) {
			return true;
		}
		return super.isSubtypeOf(t);
	}

	public override mutableOf(): TypeIntersection {
		return new TypeIntersection(...this.operands.map((s) => s.mutableOf()) as [Type, Type, ...Type[]]);
	}

	public override immutableOf(): TypeIntersection {
		return new TypeIntersection(...this.operands.map((s) => s.immutableOf()) as [Type, Type, ...Type[]]);
	}

	public override combineTuplesOrRecords(): Type {
		return (
			this.operands.every((s) => s instanceof TypeTuple)  ? (this.operands as readonly [TypeTuple,  TypeTuple,  ...readonly TypeTuple[]]) .reduce((a, b) => TypeIntersection.intersectTuples (a, b)) :
			this.operands.every((s) => s instanceof TypeRecord) ? (this.operands as readonly [TypeRecord, TypeRecord, ...readonly TypeRecord[]]).reduce((a, b) => TypeIntersection.intersectRecords(a, b)) :
			this
		);
	}
}
