import {
	Set_intersectionEq,
} from './package.js';
import {
	SolidTypeTuple,
	SolidTypeRecord,
	SolidObject,
} from './index.js';
import {solidObjectsIdentical} from './utils-private.js';
import {SolidType} from './SolidType.js';



/**
 * A type intersection of two types `T` and `U` is the type
 * that contains values either assignable to `T` *or* assignable to `U`.
 */
export class SolidTypeIntersection extends SolidType {
	declare readonly isBottomType: boolean;

	/**
	 * Construct a new SolidTypeIntersection object.
	 * @param left the first type
	 * @param right the second type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		private readonly left:  SolidType,
		private readonly right: SolidType,
		is_mutable: boolean = false,
	) {
		super(is_mutable, Set_intersectionEq(left.values, right.values, solidObjectsIdentical));
		this.isBottomType = this.left.isBottomType || this.right.isBottomType || this.isBottomType;
	}

	override toString(): string {
		return `${ this.left } & ${ this.right }`;
	}
	override includes(v: SolidObject): boolean {
		return this.left.includes(v) && this.right.includes(v)
	}
	override isSubtypeOf_do(t: SolidType): boolean {
		/** 3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C` */
		if (this.left.isSubtypeOf(t) || this.right.isSubtypeOf(t)) { return true }
		/** 3-1 | `A  & B <: A  &&  A  & B <: B` */
		if (t.equals(this.left) || t.equals(this.right)) { return true }
		return super.isSubtypeOf_do(t)
	}
	override mutableOf(): SolidTypeIntersection {
		return new SolidTypeIntersection(this.left, this.right, true);
	}
	isSupertypeOf(t: SolidType): boolean {
		/** 3-5 | `A <: C    &&  A <: D  <->  A <: C  & D` */
		return t.isSubtypeOf(this.left) && t.isSubtypeOf(this.right);
	}
	combineTuplesOrRecords(): SolidType {
		return (
			(this.left instanceof SolidTypeTuple  && this.right instanceof SolidTypeTuple)  ? this.left.intersectWithTuple(this.right)  :
			(this.left instanceof SolidTypeRecord && this.right instanceof SolidTypeRecord) ? this.left.intersectWithRecord(this.right) :
			this
		);
	}
}
