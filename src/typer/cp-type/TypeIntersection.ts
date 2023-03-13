import * as xjs from 'extrajs';
import {
	languageValuesIdentical,
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
	public declare readonly isBottomType: boolean;

	/**
	 * Construct a new TypeIntersection object.
	 * @param left the first type
	 * @param right the second type
	 */
	public constructor(
		public readonly left:  Type,
		public readonly right: Type,
	) {
		super(false, xjs.Set.intersection(left.values, right.values, languageValuesIdentical));
		this.isBottomType = this.left.isBottomType || this.right.isBottomType || this.isBottomType;
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.left.hasMutable || this.right.hasMutable;
	}

	public override toString(): string {
		return `${ this.left } & ${ this.right }`;
	}

	public override includes(v: OBJ.Object): boolean {
		return this.left.includes(v) && this.right.includes(v);
	}

	protected override union_do(t: Type): Type {
		/**
		 * 2-6 | `A \| (B  & C) == (A \| B)  & (A \| C)`
		 *     |  (B  & C) \| A == (B \| A)  & (C \| A)
		 */
		return this.left.union(t).intersect(this.right.union(t));
	}

	protected override isSubtypeOf_do(t: Type): boolean {
		/** 3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C` */
		if (this.left.isSubtypeOf(t) || this.right.isSubtypeOf(t)) {
			return true;
		}
		/** 3-1 | `A  & B <: A  &&  A  & B <: B` */
		if (t.equals(this.left) || t.equals(this.right)) {
			return true;
		}
		return super.isSubtypeOf_do(t);
	}

	public override mutableOf(): TypeIntersection {
		return new TypeIntersection(this.left.mutableOf(), this.right.mutableOf());
	}

	public override immutableOf(): TypeIntersection {
		return new TypeIntersection(this.left.immutableOf(), this.right.immutableOf());
	}

	public isSupertypeOf(t: Type): boolean {
		/** 3-5 | `A <: C    &&  A <: D  <->  A <: C  & D` */
		return t.isSubtypeOf(this.left) && t.isSubtypeOf(this.right);
	}

	public combineTuplesOrRecords(): Type {
		return (
			(this.left instanceof TypeTuple  && this.right instanceof TypeTuple)  ? this.left.intersectWithTuple(this.right)  :
			(this.left instanceof TypeRecord && this.right instanceof TypeRecord) ? this.left.intersectWithRecord(this.right) :
			this
		);
	}
}
