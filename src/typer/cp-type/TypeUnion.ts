import * as xjs from 'extrajs';
import {strictEqual} from '../../lib/index.js';
import {languageValuesIdentical} from '../utils-private.js';
import type * as OBJ from '../cp-object/index.js';
import {
	TypeCollectionIndexedStatic,
	TypeCollectionKeyedStatic,
} from './index.js';
import {Type} from './Type.js';



/**
 * A type union of two types `T` and `U` is the type
 * that contains values both assignable to `T` *and* assignable to `U`.
 */
export class TypeUnion extends Type {
	public override readonly isReference:  boolean = this.left.isReference || this.right.isReference;
	public override readonly isBottomType: boolean = this.left.isBottomType && this.right.isBottomType;

	/**
	 * Construct a new TypeUnion object.
	 * @param left the first type
	 * @param right the second type
	 */
	public constructor(
		public readonly left:  Type,
		public readonly right: Type,
	) {
		super(false, xjs.Set.union(left.values, right.values, languageValuesIdentical));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.left.hasMutable || this.right.hasMutable;
	}

	public override toString(): string {
		return `${ this.left } | ${ this.right }`;
	}

	public override includes(v: OBJ.Object): boolean {
		return this.left.includes(v) || this.right.includes(v);
	}

	@Type.intersectDeco
	public override intersect(t: Type): Type {
		/**
		 * 2-5 | `A  & (B \| C) == (A  & B) \| (A  & C)`
		 *     |  (B \| C)  & A == (B  & A) \| (C  & A)
		 */
		return this.left.intersect(t).union(this.right.intersect(t));
	}

	@Type.subtractDeco
	public override subtract(t: Type): Type {
		/** 4-4 | `(A \| B) - C == (A - C) \| (B - C)` */
		return this.left.subtract(t).union(this.right.subtract(t));
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		/** 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C` */
		return this.left.isSubtypeOf(t) && this.right.isSubtypeOf(t);
	}

	public override mutableOf(): TypeUnion {
		return new TypeUnion(this.left.mutableOf(), this.right.mutableOf());
	}

	public override immutableOf(): TypeUnion {
		return new TypeUnion(this.left.immutableOf(), this.right.immutableOf());
	}

	public subtractedFrom(t: Type): Type {
		/** 4-5 | `A - (B \| C) == (A - B)  & (A - C)` */
		return t.subtract(this.left).intersect(t.subtract(this.right));
	}

	public isNecessarilySupertypeOf(t: Type): boolean {
		/** 3-6 | `A <: C  \|\|  A <: D  -->  A <: C \| D` */
		if (t.isSubtypeOf(this.left) || t.isSubtypeOf(this.right)) {
			return true;
		}
		/** 3-2 | `A <: A \| B  &&  B <: A \| B` */
		if (t.equals(this.left) || t.equals(this.right)) {
			return true;
		}
		return false;
	}

	public combineTuplesOrRecords(): Type {
		return (
			(this.left instanceof TypeCollectionIndexedStatic && this.right instanceof TypeCollectionIndexedStatic) ? this.left.unionWithTuple(this.right)  :
			(this.left instanceof TypeCollectionKeyedStatic   && this.right instanceof TypeCollectionKeyedStatic)   ? this.left.unionWithRecord(this.right) :
			this
		);
	}
}
