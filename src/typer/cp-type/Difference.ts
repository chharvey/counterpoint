import * as xjs from 'extrajs';
import {
	languageValuesIdentical,
	strictEqual,
	memoizeBinOp,
} from '../utils-private.js';
import type * as VALUE from '../cp-value/index.js';
import {
	toStringDeco,
	subtypeDeco,
	Type,
} from './Type.js';
import {Union} from './Union.js';



/**
 * A type difference of two types `T` and `U` is the type
 * that contains values assignable to `T` but *not* assignable to `U`.
 * @final
 */
export class Difference extends Type {
	/**
	 * Construct a new Difference object.
	 * @param left the first type
	 * @param right the second type
	 */
	public constructor(
		public readonly left:  Type,
		public readonly right: Type,
	) {
		super(false, xjs.Set.difference(left.values, right.values, languageValuesIdentical));
	}

	/*
	 * We can assert that this is never bottom because
	 * the only cases in which it could be bottom are
	 * 1. if left is bottom
	 * 2. if left is a subtype of right
	 * each of which is impossible because the algorithm would have already produced the `never` type.
	 */

	/*
	 * We can assert that this is never top because
	 * the only case in which it could be top is
	 * if the left is top and the right is bottom,
	 * which is impossible because the algorithm would have already produced the `unknown` type.
	 */

	public override get isReference(): boolean {
		return this.left.isReference;
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.left.hasMutable || this.right.hasMutable;
	}

	@toStringDeco
	public override toString(): string {
		return [this.left, this.right].map((s) => s instanceof Union ? `(${ s })` : s).join(' - ');
	}

	public override includes(v: VALUE.Value): boolean {
		return this.left.includes(v) && !this.right.includes(v);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return this.left.isSubtypeOf(t) || super.isSubtypeOf(t);
	}

	public override mutableOf(): Difference {
		return new Difference(this.left.mutableOf(), this.right.mutableOf());
	}

	public override immutableOf(): Difference {
		return new Difference(this.left.immutableOf(), this.right.immutableOf());
	}
}
