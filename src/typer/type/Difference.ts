import * as xjs from 'extrajs';
import {
	language_values_identical,
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import type * as VALUE from '../value/index.ts';
import {
	subtypeLaws,
	disjointLaws,
	type Type,
} from './Type.ts';
import {
	botOrTopString,
	TypeOperation,
} from './TypeOperation.ts';
import {Union} from './Union.ts';



/**
 * A type difference of two types `T` and `U` is the type
 * that contains values assignable to `T` but *not* assignable to `U`.
 * @final
 */
export class Difference extends TypeOperation {
	/**
	 * Construct a new Difference object.
	 * @param left the first type
	 * @param right the second type
	 */
	public constructor(
		public readonly left:  Type,
		public readonly right: Type,
	) {
		super(xjs.Set.difference(left.values, right.values, language_values_identical), [left, right], left.isMutable);
	}

	/*
	 * We can assert that this is never bottom because
	 * the only cases in which it could be bottom are
	 * 1. if left is bottom
	 * 2. if left is a subtype of right
	 * each of which is impossible because the algorithm would have already produced the `nothing` type.
	 */

	/*
	 * We can assert that this is never top because
	 * the only case in which it could be top is
	 * if the left is top and the right is bottom,
	 * which is impossible because the algorithm would have already produced the `anything` type.
	 */

	public override get isReference(): boolean {
		return this.left.isReference;
	}

	@botOrTopString
	public override toString(): string {
		return this.operands.map((s) => s instanceof Union ? `(${ s })` : s).join(' - ');
	}

	public override includes(v: VALUE.Value): boolean {
		return this.left.includes(v) && !this.right.includes(v);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	public override isSubtypeOf(t: Type): boolean {
		return this.left.isSubtypeOf(t) || super.isSubtypeOf(t);
	}

	@memoizeBinOp(true)
	@disjointLaws
	public override isDisjointWith(t: Type): boolean {
		/* 4-4 | `A /= B - C  <--  A <: C  ||  A /= B` */
		if (t.isDisjointWith(this.left) || t.isSubtypeOf(this.right)) {
			return true;
		}
		return super.isDisjointWith(t);
	}

	public override mutableOf(): Difference {
		return new Difference(this.left.mutableOf(), this.right.mutableOf());
	}

	public override immutableOf(): Difference {
		return new Difference(this.left.immutableOf(), this.right.immutableOf());
	}
}
