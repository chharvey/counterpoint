import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import type {EntryType} from '../utils-public.ts';
import {
	languageValuesIdentical,
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import type * as VALUE from '../cp-value/index.ts';
import {
	Union,
	Tuple as TypeTuple,
	Record as TypeRecord,
	NEVER,
} from './index.ts';
import {
	type ReadonlyArrayOfAtLeast2,
	language_types_equal,
} from './utils-private.ts';
import {
	typeConstant,
	intersectionRules,
	subtypeRules,
	type Type,
} from './Type.ts';
import {botOrTopString} from './TypeOperation.ts';
import {Combinable} from './Combinable.ts';



/**
 * A type intersection of two types `T` and `U` is the type
 * that contains values both assignable to `T` *and* assignable to `U`.
 * @final
 */
export class Intersection extends Combinable {
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
			? Intersection.all(...arg0)
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
		const items: EntryType[] = [...s.invariants];
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
		const props = new Map<bigint, EntryType>([...s.invariants]);
		[...t.invariants].forEach(([id, typ]) => {
			props.set(id, s.invariants.has(id) ? {
				type:     s.invariants.get(id)!.type.intersect(typ.type),
				optional: s.invariants.get(id)!.optional && typ.optional,
			} : typ);
		});
		return new TypeRecord(props);
	}


	/**
	 * Construct a new Intersection object.
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
				...(operand0 instanceof Intersection ? operand0.operands : [operand0] as const),
				...(operand1 instanceof Intersection ? operand1.operands : [operand1] as const),
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

	@botOrTopString
	public override toString(): string {
		return this.operands.map((s) => s instanceof Union ? `(${ s })` : s).join(' & ');
	}

	public override includes(v: VALUE.Value): boolean {
		return this.operands.every((s) => s.includes(v));
	}

	@memoizeBinOp(true)
	@typeConstant
	@intersectionRules
	public override intersect(t: Type): Type {
		/*
		 * 3-9 | `C <: A --> (A  & B)  & C == B  & C`
		 *     | `C <: B --> (A  & B)  & C == A  & C`
		 */
		const filtered_operands = this.operands.filter((s) => !t.isSubtypeOf(s));
		if (filtered_operands.length < this.operands.length) {
			if (filtered_operands.length >= 2) {
				return new Intersection(filtered_operands[0], filtered_operands[1], ...filtered_operands.slice(2)).intersect(t);
			} else if (filtered_operands.length) {
				return filtered_operands[0].intersect(t);
			} else {
				/* 3-5 | `A <: C    &&  A <: D  <->  A <: C  & D` */
				assert.ok(t.isSubtypeOf(this), `Expected ${ t } to be a subtype of ${ this }.`);
				/* 3-3 | `A <: B  <->  A  & B == A` */
				return t;
			}
		} else {
			return new Intersection(this, t).normalize();
		}
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeRules
	public override isSubtypeOf(t: Type): boolean {
		/* 3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C` */
		if (this.operands.some((s) => s.isSubtypeOf(t))) {
			return true;
		}
		/* 3-1 | `A  & B <: A  &&  A  & B <: B` */
		if (this.operands.some((s) => s.equals(t))) {
			return true;
		}
		return super.isSubtypeOf(t);
	}

	public override mutableOf(): Intersection {
		return new Intersection(...this.operands.map((s) => s.mutableOf()) as [Type, Type, ...Type[]]);
	}

	public override immutableOf(): Intersection {
		return new Intersection(...this.operands.map((s) => s.immutableOf()) as [Type, Type, ...Type[]]);
	}

	public override normalize(): Type {
		/*
		 * 2-6 | `A \| (B  & C) == (A \| B)  & (A \| C)`
		 *     | `(A \| B)  & (A \| C) == A \| (B  & C)`
		 */
		// (A1 | A2 | B1 | B2 | E | F) & (A1 | A2 | C1 | C2 | F | G) & (A1 | A2 | D1 | D2 | E | G)
		// == (A1 | A2) | ((B1 | B2 | E | F) & (C1 | C2 | F | G) & (D1 | D2 | E | G))
		if (this.operands.every((s) => s instanceof Union)) {
			const unions: readonly ReadonlySet<Type>[] = (this.operands as ReadonlyArrayOfAtLeast2<Union>).map((s) => new Set<Type>(s.operands));
			const common: ReadonlySet<Type>            = unions.reduce((a, b) => xjs.Set.intersection(a, b, language_types_equal));

			if (common.size) {
				const differing: readonly ReadonlySet<Type>[] = unions.map((union) => xjs.Set.difference(union, common, language_types_equal));
				return Union.all(...common, Intersection.all(differing.map((types) => Union.all(...types))));
			}
		}
		return this;
	}

	public override denormalize(): Type {
		/*
		 * 2-5 | `A  & (B \| C) == (A  & B) \| (A  & C)`
		 *     | `(B \| C)  & A == (B  & A) \| (C  & A)`
		 */
		const union: Union | null = this.operands.find((s): s is Union => s instanceof Union) ?? null;
		if (union) {
			const not_union: readonly Type[] = this.operands.filter((s) => s !== union);
			const right: Type = not_union.length >= 2
				? new Union(not_union[0], not_union[1], ...not_union.slice(2))
				: (assert.strictEqual(not_union.length, 1), not_union[0]);
			return new Union(...union.operands.map((s) => s.intersect(right)) as readonly Type[] as typeof union.operands);
		} else {
			return this;
		}
	}

	public override combineTuplesOrRecords(): Type {
		return (
			this.operands.every((s) => s instanceof TypeTuple)  ? (this.operands as ReadonlyArrayOfAtLeast2<TypeTuple>) .reduce((a, b) => Intersection.intersectTuples (a, b)) :
			this.operands.every((s) => s instanceof TypeRecord) ? (this.operands as ReadonlyArrayOfAtLeast2<TypeRecord>).reduce((a, b) => Intersection.intersectRecords(a, b)) :
			this
		);
	}
}
