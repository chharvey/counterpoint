import * as xjs from 'extrajs';
import {
	strictEqual,
	solidObjectsIdentical,
	SolidObject,
} from './package.js';
import {SolidType} from './SolidType.js';
import {
	SolidTypeTuple,
	SolidTypeRecord,
} from './index.js';



/**
 * A type union of two types `T` and `U` is the type
 * that contains values both assignable to `T` *and* assignable to `U`.
 */
export class SolidTypeUnion extends SolidType {
	declare readonly isBottomType: boolean;

	/**
	 * Construct a new SolidTypeUnion object.
	 * @param left the first type
	 * @param right the second type
	 */
	constructor (
		private readonly left:  SolidType,
		private readonly right: SolidType,
	) {
		super(false, xjs.Set.union(left.values, right.values, solidObjectsIdentical));
		this.isBottomType = this.left.isBottomType && this.right.isBottomType;
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.left.hasMutable || this.right.hasMutable;
	}
	override toString(): string {
		return `${ this.left } | ${ this.right }`;
	}
	override includes(v: SolidObject): boolean {
		return this.left.includes(v) || this.right.includes(v)
	}
	/**
	 * 2-5 | `A  & (B \| C) == (A  & B) \| (A  & C)`
	 *     |  (B \| C)  & A == (B  & A) \| (C  & A)
	 */
	@SolidType.intersectDeco
	override intersect(t: SolidType): SolidType {
		return this.left.intersect(t).union(this.right.intersect(t));
	}
	@SolidType.subtractDeco
	override subtract(t: SolidType): SolidType {
		/** 4-4 | `(A \| B) - C == (A - C) \| (B - C)` */
		return this.left.subtract(t).union(this.right.subtract(t));
	}
	@strictEqual
	@SolidType.subtypeDeco
	override isSubtypeOf(t: SolidType): boolean {
		/** 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C` */
		return this.left.isSubtypeOf(t) && this.right.isSubtypeOf(t)
	}
	override mutableOf(): SolidTypeUnion {
		return new SolidTypeUnion(this.left.mutableOf(), this.right.mutableOf());
	}
	override immutableOf(): SolidTypeUnion {
		return new SolidTypeUnion(this.left.immutableOf(), this.right.immutableOf());
	}
	subtractedFrom(t: SolidType): SolidType {
		/** 4-5 | `A - (B \| C) == (A - B)  & (A - C)` */
		return t.subtract(this.left).intersect(t.subtract(this.right));
	}
	isNecessarilySupertypeOf(t: SolidType): boolean {
		/** 3-6 | `A <: C  \|\|  A <: D  -->  A <: C \| D` */
		if (t.isSubtypeOf(this.left) || t.isSubtypeOf(this.right)) { return true; }
		/** 3-2 | `A <: A \| B  &&  B <: A \| B` */
		if (t.equals(this.left) || t.equals(this.right)) { return true; }
		return false;
	}
	combineTuplesOrRecords(): SolidType {
		return (
			(this.left instanceof SolidTypeTuple  && this.right instanceof SolidTypeTuple)  ? this.left.unionWithTuple(this.right)  :
			(this.left instanceof SolidTypeRecord && this.right instanceof SolidTypeRecord) ? this.left.unionWithRecord(this.right) :
			this
		);
	}
}
