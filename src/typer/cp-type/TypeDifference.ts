import * as xjs from 'extrajs';
import {
	languageValuesIdentical,
	OBJ,
} from './package.js';
import {Type} from './Type.js';



/**
 * A type difference of two types `T` and `U` is the type
 * that contains values assignable to `T` but *not* assignable to `U`.
 */
export class TypeDifference extends Type {
	public declare readonly isBottomType: boolean;

	/**
	 * Construct a new TypeDifference object.
	 * @param left the first type
	 * @param right the second type
	 */
	 public constructor(
		private readonly left:  Type,
		private readonly right: Type,
	) {
		super(false, xjs.Set.difference(left.values, right.values, languageValuesIdentical));
		/*
		We can assert that this is always non-empty because
		the only cases in which it could be empty are
		1. if left is empty
		2. if left is a subtype of right
		each of which is impossible because the algorithm would have already produced the `never` type.
		*/
		this.isBottomType = false;
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.left.hasMutable || this.right.hasMutable;
	}

	public override toString(): string {
		return `${ this.left } - ${ this.right }`;
	}

	public override includes(v: OBJ.Object): boolean {
		return this.left.includes(v) && !this.right.includes(v);
	}

	protected override isSubtypeOf_do(t: Type): boolean {
		return this.left.isSubtypeOf(t) || super.isSubtypeOf_do(t);
	}

	public override mutableOf(): TypeDifference {
		return new TypeDifference(this.left.mutableOf(), this.right.mutableOf());
	}

	public override immutableOf(): TypeDifference {
		return new TypeDifference(this.left.immutableOf(), this.right.immutableOf());
	}

	public isSupertypeOf(t: Type): boolean {
		/** 4-3 | `A <: B - C  <->  A <: B  &&  A & C == never` */
		return t.isSubtypeOf(this.left) && t.intersect(this.right).isBottomType;
	}
}