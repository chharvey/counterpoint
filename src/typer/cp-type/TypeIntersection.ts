import * as xjs from 'extrajs';
import {
	solidObjectsIdentical,
	OBJ,
} from './package.js';
import {Type} from './Type.js';
import {
	TypeTuple,
	TypeRecord,
} from './index.js';



/**
 * A type intersection of two types `T` and `U` is the type
 * that contains values either assignable to `T` *or* assignable to `U`.
 */
export class TypeIntersection extends Type {
	declare readonly isBottomType: boolean;

	/**
	 * Construct a new TypeIntersection object.
	 * @param left the first type
	 * @param right the second type
	 */
	constructor (
		private readonly left:  Type,
		private readonly right: Type,
	) {
		super(false, xjs.Set.intersection(left.values, right.values, solidObjectsIdentical));
		this.isBottomType = this.left.isBottomType || this.right.isBottomType || this.isBottomType;
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.left.hasMutable || this.right.hasMutable;
	}
	override toString(): string {
		return `${ this.left } & ${ this.right }`;
	}
	override includes(v: OBJ.SolidObject): boolean {
		return this.left.includes(v) && this.right.includes(v)
	}
	protected override isSubtypeOf_do(t: Type): boolean {
		/** 3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C` */
		if (this.left.isSubtypeOf(t) || this.right.isSubtypeOf(t)) { return true }
		/** 3-1 | `A  & B <: A  &&  A  & B <: B` */
		if (t.equals(this.left) || t.equals(this.right)) { return true }
		return super.isSubtypeOf_do(t)
	}
	override mutableOf(): TypeIntersection {
		return new TypeIntersection(this.left.mutableOf(), this.right.mutableOf());
	}
	override immutableOf(): TypeIntersection {
		return new TypeIntersection(this.left.immutableOf(), this.right.immutableOf());
	}
	isSupertypeOf(t: Type): boolean {
		/** 3-5 | `A <: C    &&  A <: D  <->  A <: C  & D` */
		return t.isSubtypeOf(this.left) && t.isSubtypeOf(this.right);
	}
	combineTuplesOrRecords(): Type {
		return (
			(this.left instanceof TypeTuple  && this.right instanceof TypeTuple)  ? this.left.intersectWithTuple(this.right)  :
			(this.left instanceof TypeRecord && this.right instanceof TypeRecord) ? this.left.intersectWithRecord(this.right) :
			this
		);
	}
}
