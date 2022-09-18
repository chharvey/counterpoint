import * as xjs from 'extrajs';
import {
	strictEqual,
	languageValuesIdentical,
	OBJ,
} from './package.js';
import {Type} from './Type.js';
import {
	TypeTuple,
	TypeRecord,
} from './index.js';



/**
 * A type union of two types `T` and `U` is the type
 * that contains values both assignable to `T` *and* assignable to `U`.
 */
export class TypeUnion extends Type {
	declare readonly isBottomType: boolean;

	/**
	 * Construct a new TypeUnion object.
	 * @param left the first type
	 * @param right the second type
	 */
	constructor (
		public readonly left:  Type,
		public readonly right: Type,
	) {
		super(false, xjs.Set.union(left.values, right.values, languageValuesIdentical));
		this.isBottomType = this.left.isBottomType && this.right.isBottomType;
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.left.hasMutable || this.right.hasMutable;
	}
	override toString(): string {
		return `${ this.left } | ${ this.right }`;
	}
	override includes(v: OBJ.Object): boolean {
		return this.left.includes(v) || this.right.includes(v)
	}
	/**
	 * 2-5 | `A  & (B \| C) == (A  & B) \| (A  & C)`
	 *     |  (B \| C)  & A == (B  & A) \| (C  & A)
	 */
	@Type.intersectDeco
	override intersect(t: Type): Type {
		return this.left.intersect(t).union(this.right.intersect(t));
	}
	@Type.subtractDeco
	override subtract(t: Type): Type {
		/** 4-4 | `(A \| B) - C == (A - C) \| (B - C)` */
		return this.left.subtract(t).union(this.right.subtract(t));
	}
	@strictEqual
	@Type.subtypeDeco
	override isSubtypeOf(t: Type): boolean {
		/** 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C` */
		return this.left.isSubtypeOf(t) && this.right.isSubtypeOf(t)
	}
	override mutableOf(): TypeUnion {
		return new TypeUnion(this.left.mutableOf(), this.right.mutableOf());
	}
	override immutableOf(): TypeUnion {
		return new TypeUnion(this.left.immutableOf(), this.right.immutableOf());
	}
	subtractedFrom(t: Type): Type {
		/** 4-5 | `A - (B \| C) == (A - B)  & (A - C)` */
		return t.subtract(this.left).intersect(t.subtract(this.right));
	}
	isNecessarilySupertypeOf(t: Type): boolean {
		/** 3-6 | `A <: C  \|\|  A <: D  -->  A <: C \| D` */
		if (t.isSubtypeOf(this.left) || t.isSubtypeOf(this.right)) { return true; }
		/** 3-2 | `A <: A \| B  &&  B <: A \| B` */
		if (t.equals(this.left) || t.equals(this.right)) { return true; }
		return false;
	}
	combineTuplesOrRecords(): Type {
		return (
			(this.left instanceof TypeTuple  && this.right instanceof TypeTuple)  ? this.left.unionWithTuple(this.right)  :
			(this.left instanceof TypeRecord && this.right instanceof TypeRecord) ? this.left.unionWithRecord(this.right) :
			this
		);
	}
}
