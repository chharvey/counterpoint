import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	language_types_equal,
	language_values_identical,
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {NOTHING} from './index.ts';
import type {ArrayOfAtLeast2} from './utils-private.ts';
import {
	typeConstant,
	unionLaws,
	differenceLaws,
	subtypeLaws,
	disjointLaws,
	type Type,
} from './Type.ts';
import {botOrTopString} from './TypeOperation.ts';
import {Intersection} from './Intersection.ts';
import {Combinable} from './Combinable.ts';



/**
 * A type union of two types `T` and `U` is the type
 * that contains values either assignable to `T` *or* assignable to `U`.
 *
 * Known subclasses:
 * - TypeBoolean
 */
export class Union extends Combinable {
	/**
	 * Unions all the given types.
	 * If an empty array is given, return type `nothing`.
	 * @param types the types to union
	 * @returns the union
	 */
	public static all(...types: readonly Type[]): Type {
		return types.reduce((a, b) => a.union(b), NOTHING);
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
			[operand0, operand1, ...operands].flatMap((operand) => operand instanceof Union ? operand.operands : [operand]) as ArrayOfAtLeast2<Type>,
			[operand0, operand1, ...operands].every((operand) => operand.isMutable),
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

	@botOrTopString
	public override toString(): string {
		let strings: readonly string[] = this.operands.map((s) => s.toString());

		// if `false` and `true` are both among the operands, replace them with `bool`
		const bools: readonly string[] = [VALUE.FALSE, VALUE.TRUE].map((bv) => bv.toString());
		if (bools.every((bs) => strings.includes(bs))) {
			strings = [...strings.filter((s) => !bools.includes(s)), 'bool'];
		}

		return strings.toSorted().join(' | ');
	}

	public override includes(v: VALUE.Value): boolean {
		return this.operands.some((s) => s.includes(v));
	}

	@memoizeBinOp(true)
	@typeConstant
	@unionLaws
	public override union(t: Type): Type {
		/*
		 * 3-a | `A <: C --> (A \| B) \| C == B \| C`
		 *     | `B <: C --> (A \| B) \| C == A \| C`
		 */
		const filtered_operands = this.operands.filter((s) => !s.isSubtypeOf(t));
		if (filtered_operands.length < this.operands.length) {
			if (filtered_operands.length >= 2) {
				return Union.all(...filtered_operands, t);
			} else if (filtered_operands.length) {
				return filtered_operands[0].union(t);
			} else {
				/* 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C` */
				assert.ok(this.isSubtypeOf(t), `Expected ${ this } to be a subtype of ${ t }.`);
				return assert.fail('`@unionLaws` should have already returned.');
			}
		} else {
			return new Union(this, t).normalize(); // super.union(t);
		}
	}

	@typeConstant
	@differenceLaws
	public override subtract(t: Type): Type {
		/* 4-5 | `(A \| B) - C == (A - C) \| (B - C)` */
		return Union.all(...this.operands.map((s) => s.subtract(t)));
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	public override isSubtypeOf(t: Type): boolean {
		/* 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C` */
		return this.operands.every((s) => s.isSubtypeOf(t));
	}

	@memoizeBinOp(true)
	@disjointLaws
	public override isDisjointWith(t: Type): boolean {
		return this.operands.every((s) => s.isDisjointWith(t));
	}

	public override mutableOf(): Union {
		return new Union(...this.operands.map((s) => s.mutableOf()) as [Type, Type, ...Type[]]);
	}

	public override immutableOf(): Union {
		return new Union(...this.operands.map((s) => s.immutableOf()) as [Type, Type, ...Type[]]);
	}

	public override normalize(): Type {
		/*
		 * 2-8 | `A  & (B \| C) == (A  & B) \| (A  & C)`
		 *     | `(A  & B) \| (A  & C) == A  & (B \| C)`
		 */
		// (A1 & A2 & B1 & B2 & E & F) | (A1 & A2 & C1 & C2 & F & G) | (A1 & A2 & D1 & D2 & E & G)
		// == (A1 & A2) & ((B1 & B2 & E & F) | (C1 & C2 & F & G) | (D1 & D2 & E & G))
		if (this.operands.every((s) => s instanceof Intersection)) {
			const intersections_data = this.operands.map((intersection) => new Set<Type>(intersection.operands));
			const common: ReadonlySet<Type> = intersections_data.reduce((a, b) => xjs.Set.intersection(a, b, language_types_equal));

			if (common.size) {
				const differing = intersections_data.map((intersection_data) => xjs.Set.difference(intersection_data, common, language_types_equal));
				return Intersection.all(...common, Union.all(...differing.map((types) => Intersection.all(...types))));
			}
		}
		return this;
	}

	public override denormalize(): Type {
		/*
		 * 2-9 | `A \| (B  & C) == (A \| B)  & (A \| C)`
		 *     | `(B  & C) \| A == (B \| A)  & (C \| A)`
		 */
		const intersection: Intersection | undefined = this.operands.find((s): s is Intersection => s instanceof Intersection);
		if (intersection) {
			const not_intersection: readonly Type[] = this.operands.filter((s) => s !== intersection);
			// union all the operands that are not `intersection`
			const right: Type = not_intersection.length >= 2
				? Union.all(...not_intersection)
				: (assert.ok(not_intersection.length), not_intersection[0]);
			// returns a `new Intersection()` instead of calling `Intersection.all()` because the latter calls `normalize`
			return new Intersection(...intersection.operands.map((s) => s.union(right)) as ArrayOfAtLeast2<Type>);
		} else {
			return this;
		}
	}
}
