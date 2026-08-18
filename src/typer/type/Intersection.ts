import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {memoizeGetter} from '../../lib/index.ts';
import {
	language_types_equal,
	language_values_identical,
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import type * as VALUE from '../value/index.ts';
import {
	Union,
	ANYTHING,
} from './index.ts';
import type {ArrayOfAtLeast2} from './utils-private.ts';
import {
	typeConstant,
	intersectionLaws,
	subtypeLaws,
	disjointLaws,
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
	 * If an empty array is given, return type `anything`.
	 * @param types the types to intersect
	 * @returns the intersection
	 */
	public static all(...types: readonly Type[]): Type {
		return types.reduce((a, b) => a.intersect(b), ANYTHING);
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
				(accum, next) => xjs.Set.intersection(accum, next.values, language_values_identical),
				xjs.Set.intersection(operand0.values, operand1.values, language_values_identical),
			),
			[operand0, operand1, ...operands].flatMap((operand) => operand instanceof Intersection ? operand.operands : [operand]) as ArrayOfAtLeast2<Type>,
			[operand0, operand1, ...operands].some((operand) => operand.isMutable),
		);
	}

	@memoizeGetter
	public override get isBottomType(): boolean {
		/* This could be bottom if the operands are disjoint. */
		return this.operands.some((s) => this.operands.some((r) => s.isDisjointWith(r)));
	}

	/*
	 * We can assert that this is never top because
	 * the only case in which it could be top is
	 * if both the left and the right are top,
	 * which is impossible because the algorithm would have already produced the `anything` type.
	 */

	@botOrTopString
	public override toString(): string {
		return this.operands.map((s) => s instanceof Union ? `(${ s })` : s).toSorted().join(' & ');
	}

	public override includes(v: VALUE.Value): boolean {
		return this.operands.every((s) => s.includes(v));
	}

	@memoizeBinOp(true)
	@typeConstant
	@intersectionLaws
	public override intersect(t: Type): Type {
		/*
		 * 3-9 | `C <: A --> (A  & B)  & C == B  & C`
		 *     | `C <: B --> (A  & B)  & C == A  & C`
		 */
		const filtered_operands = this.operands.filter((s) => !t.isSubtypeOf(s));
		if (filtered_operands.length < this.operands.length) {
			if (filtered_operands.length >= 2) {
				return Intersection.all(...filtered_operands, t);
			} else if (filtered_operands.length) {
				return filtered_operands[0].intersect(t);
			} else {
				/* 3-5 | `A <: C    &&  A <: D  <->  A <: C  & D` */
				assert.ok(t.isSubtypeOf(this), `Expected ${ t } to be a subtype of ${ this }.`);
				return assert.fail('`@intersectionLaws` should have already returned.');
			}
		} else {
			return new Intersection(this, t).normalize(); // super.intersect(t);
		}
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
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

	@memoizeBinOp(true)
	@disjointLaws
	public override isDisjointWith(t: Type): boolean {
		return this.operands.some((s) => s.isDisjointWith(t));
	}

	public override mutableOf(): Intersection {
		return new Intersection(...this.operands.map((s) => s.mutableOf()) as [Type, Type, ...Type[]]);
	}

	public override immutableOf(): Intersection {
		return new Intersection(...this.operands.map((s) => s.immutableOf()) as [Type, Type, ...Type[]]);
	}

	public override normalize(): Type {
		/*
		 * 2-9 | `A \| (B  & C) == (A \| B)  & (A \| C)`
		 *     | `(A \| B)  & (A \| C) == A \| (B  & C)`
		 */
		// (A1 | A2 | B1 | B2 | E | F) & (A1 | A2 | C1 | C2 | F | G) & (A1 | A2 | D1 | D2 | E | G)
		// == (A1 | A2) | ((B1 | B2 | E | F) & (C1 | C2 | F | G) & (D1 | D2 | E | G))
		if (this.operands.every((s) => s instanceof Union)) {
			const unions_data = this.operands.map((union) => new Set<Type>(union.operands));
			const common: ReadonlySet<Type> = unions_data.reduce((a, b) => xjs.Set.intersection(a, b, language_types_equal));

			if (common.size) {
				const differing = unions_data.map((union_data) => xjs.Set.difference(union_data, common, language_types_equal));
				return Union.all(...common, Intersection.all(...differing.map((types) => Union.all(...types))));
			}
		}
		return this;
	}

	public override denormalize(): Type {
		/*
		 * 2-8 | `A  & (B \| C) == (A  & B) \| (A  & C)`
		 *     | `(B \| C)  & A == (B  & A) \| (C  & A)`
		 */
		const union: Union | undefined = this.operands.find((s): s is Union => s instanceof Union);
		if (union) {
			const not_union: readonly Type[] = this.operands.filter((s) => s !== union);
			// intersect all the operands that are not `union`
			const right: Type = not_union.length >= 2
				? Intersection.all(...not_union)
				: (assert.ok(not_union.length), not_union[0]);
			// returns a `new Union()` instead of calling `Union.all()` because the latter calls `normalize`
			return new Union(...union.operands.map((s) => s.intersect(right)) as ArrayOfAtLeast2<Type>);
		} else {
			return this;
		}
	}
}
