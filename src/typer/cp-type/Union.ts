import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	language_types_equal,
	language_values_identical,
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import type * as VALUE from '../cp-value/index.ts';
import {NOTHING} from './index.ts';
import type {ReadonlyArrayOfAtLeast2} from './utils-private.ts';
import {
	typeConstant,
	unionRules,
	differenceRules,
	subtypeRules,
	type Type,
} from './Type.ts';
import {botOrTopString} from './TypeOperation.ts';
import {Intersection} from './Intersection.ts';
import {Combinable} from './Combinable.ts';



/**
 * A type union of two types `T` and `U` is the type
 * that contains values either assignable to `T` *or* assignable to `U`.
 * @final
 */
export class Union extends Combinable {
	/**
	 * Unions all the given types.
	 * If an empty array is given, return type `nothing`.
	 * @param types the types to union
	 * @returns the union
	 */
	public static all(types: readonly Type[]): Type;
	public static all(...types: readonly Type[]): Type;
	public static all(arg0?: readonly Type[] | Type, ...args: readonly Type[]): Type {
		return arg0 instanceof Array
			? Union.all(...arg0)
			: arg0
				? [arg0, ...args].reduce((a, b) => a.union(b))
				: NOTHING;
	}


	/**
	 * Construct a new Union object.
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
				(accum, next) => xjs.Set.union(accum, next.values, language_values_identical),
				xjs.Set.union(operand0.values, operand1.values, language_values_identical),
			),
			[
				...(operand0 instanceof Union ? operand0.operands : [operand0] as const),
				...(operand1 instanceof Union ? operand1.operands : [operand1] as const),
				...operands,
			],
		);
	}

	/*
	 * We can assert that this is never bottom because
	 * the only case in which it could be bottom is
	 * if both the left and the right are bottom,
	 * which is impossible because the algorithm would have already produced the `nothing` type.
	 */

	/*
	 * We can assert that this is never top because
	 * the only case in which it could be top is
	 * if either the left or the right is top,
	 * which is impossible because the algorithm would have already produced the `anything` type.
	 */

	public override get isReference(): boolean {
		return this.operands.some((s) => s.isReference);
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.operands.some((s) => s.hasMutable);
	}

	@botOrTopString
	public override toString(): string {
		return this.operands.join(' | ');
	}

	public override includes(v: VALUE.Value): boolean {
		return this.operands.some((s) => s.includes(v));
	}

	@memoizeBinOp(true)
	@typeConstant
	@unionRules
	public override union(t: Type): Type {
		/*
		 * 3-a | `A <: C --> (A \| B) \| C == B \| C`
		 *     | `B <: C --> (A \| B) \| C == A \| C`
		 */
		const filtered_operands = this.operands.filter((s) => !s.isSubtypeOf(t));
		if (filtered_operands.length < this.operands.length) {
			if (filtered_operands.length >= 2) {
				return new Union(filtered_operands[0], filtered_operands[1], ...filtered_operands.slice(2)).union(t);
			} else if (filtered_operands.length) {
				return filtered_operands[0].union(t);
			} else {
				/* 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C` */
				assert.ok(this.isSubtypeOf(t), `Expected ${ this } to be a subtype of ${ t }.`);
				/* 3-4 | `A <: B  <->  A \| B == B` */
				return t;
			}
		} else {
			return new Union(this, t).normalize();
		}
	}

	@typeConstant
	@differenceRules
	public override subtract(t: Type): Type {
		/* 4-4 | `(A \| B) - C == (A - C) \| (B - C)` */
		return Union.all(this.operands.map((s) => s.subtract(t)));
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeRules
	public override isSubtypeOf(t: Type): boolean {
		/* 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C` */
		return this.operands.every((s) => s.isSubtypeOf(t));
	}

	public override mutableOf(): Union {
		return new Union(...this.operands.map((s) => s.mutableOf()) as [Type, Type, ...Type[]]);
	}

	public override immutableOf(): Union {
		return new Union(...this.operands.map((s) => s.immutableOf()) as [Type, Type, ...Type[]]);
	}

	public override normalize(): Type {
		/*
		 * 2-5 | `A  & (B \| C) == (A  & B) \| (A  & C)`
		 *     | `(A  & B) \| (A  & C) == A  & (B \| C)`
		 */
		// (A1 & A2 & B1 & B2 & E & F) | (A1 & A2 & C1 & C2 & F & G) | (A1 & A2 & D1 & D2 & E & G)
		// == (A1 & A2) & ((B1 & B2 & E & F) | (C1 & C2 & F & G) | (D1 & D2 & E & G))
		if (this.operands.every((s) => s instanceof Intersection)) {
			const intersections: readonly ReadonlySet<Type>[] = (this.operands as ReadonlyArrayOfAtLeast2<Intersection>).map((s) => new Set<Type>(s.operands));
			const common:        ReadonlySet<Type>            = intersections.reduce((a, b) => xjs.Set.intersection(a, b, language_types_equal));

			if (common.size) {
				const differing: readonly ReadonlySet<Type>[] = intersections.map((intersection) => xjs.Set.difference(intersection, common, language_types_equal));
				return Intersection.all(...common, Union.all(differing.map((types) => Intersection.all(...types))));
			}
		}
		return this;
	}

	public override denormalize(): Type {
		/*
		 * 2-6 | `A \| (B  & C) == (A \| B)  & (A \| C)`
		 *     | `(B  & C) \| A == (B \| A)  & (C \| A)`
		 */
		const intersection: Intersection | null = this.operands.find((s): s is Intersection => s instanceof Intersection) ?? null;
		if (intersection) {
			const not_intersection: readonly Type[] = this.operands.filter((s) => s !== intersection);
			const right: Type = not_intersection.length >= 2
				? new Union(not_intersection[0], not_intersection[1], ...not_intersection.slice(2))
				: (assert.strictEqual(not_intersection.length, 1), not_intersection[0]);
			return new Intersection(...intersection.operands.map((s) => s.union(right)) as readonly Type[] as typeof intersection.operands);
		} else {
			return this;
		}
	}
}
