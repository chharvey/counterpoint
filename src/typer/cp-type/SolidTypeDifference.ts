import * as xjs from 'extrajs';
import {
	solidObjectsIdentical,
	SolidObject,
} from './package.js';
import {Type} from './Type.js';



/**
 * A type difference of two types `T` and `U` is the type
 * that contains values assignable to `T` but *not* assignable to `U`.
 */
export class SolidTypeDifference extends Type {
	declare readonly isBottomType: boolean;

	/**
	 * Construct a new SolidTypeDifference object.
	 * @param left the first type
	 * @param right the second type
	 */
	constructor (
		private readonly left:  Type,
		private readonly right: Type,
	) {
		super(false, xjs.Set.difference(left.values, right.values, solidObjectsIdentical));
		/*
		We can assert that this is always non-empty because
		the only cases in which it could be empty are
		1. if left is empty
		2. if left is a subtype of right
		each of which is impossible because the algorithm would have already produced the `never` type.
		*/
		this.isBottomType = false;
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.left.hasMutable || this.right.hasMutable;
	}
	override toString(): string {
		return `${ this.left } - ${ this.right }`;
	}
	override includes(v: SolidObject): boolean {
		return this.left.includes(v) && !this.right.includes(v);
	}
	protected override isSubtypeOf_do(t: Type): boolean {
		return this.left.isSubtypeOf(t) || super.isSubtypeOf_do(t);
	}
	override mutableOf(): SolidTypeDifference {
		return new SolidTypeDifference(this.left.mutableOf(), this.right.mutableOf());
	}
	override immutableOf(): SolidTypeDifference {
		return new SolidTypeDifference(this.left.immutableOf(), this.right.immutableOf());
	}
	isSupertypeOf(t: Type): boolean {
		/** 4-3 | `A <: B - C  <->  A <: B  &&  A & C == never` */
		return t.isSubtypeOf(this.left) && t.intersect(this.right).isBottomType;
	}
}
