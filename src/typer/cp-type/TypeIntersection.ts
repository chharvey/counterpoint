import * as xjs from 'extrajs';
import {strictEqual} from '../../lib/index.js';
import {languageValuesIdentical} from '../utils-private.js';
import type * as OBJ from '../cp-object/index.js';
import {
	TypeTuple,
	TypeRecord,
} from './index.js';
import {Type} from './Type.js';



/**
 * A type intersection of two types `T` and `U` is the type
 * that contains values either assignable to `T` *or* assignable to `U`.
 */
export class TypeIntersection extends Type {
	public override readonly isReference:  boolean = this.left.isReference || this.right.isReference;
	public override readonly isBottomType: boolean = this.left.isBottomType || this.right.isBottomType || this.isBottomType;

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

	@Type.intersectDeco
	public override intersect(t: Type): Type {
		/**
		 *     |  `C <: A --> (A  & B)  & C == B  & C`
		 *     |  `C <: B --> (A  & B)  & C == A  & C`
		 */
		return (
			t.isSubtypeOf(this.left)  ? this.right.intersect(t) :
			t.isSubtypeOf(this.right) ? this.left .intersect(t) :
			new TypeIntersection(this, t)
		);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		/** 3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C` */
		if (this.left.isSubtypeOf(t) || this.right.isSubtypeOf(t)) {
			return true;
		}
		/** 3-1 | `A  & B <: A  &&  A  & B <: B` */
		if (t.equals(this.left) || t.equals(this.right)) {
			return true;
		}
		return super.isSubtypeOf(t);
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
