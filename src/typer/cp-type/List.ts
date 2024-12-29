import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../../lib/index.js';
import * as VALUE from '../cp-value/index.js';
import {
	subtypeDeco,
	referenceSubtypeDeco,
} from './decorators.js';
import {MUT_OPERATOR} from './utils-private.js';
import type {Type} from './Type.js';
import {ReferenceType} from './ReferenceType.js';



/**
 * Class for constructing a `List` type.
 * @final
 */
export class List extends ReferenceType {
	/**
	 * Construct a new List object.
	 * @param invariant a union of types in this list type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariant: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new VALUE.List()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariant.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? MUT_OPERATOR : '' }List.<${ this.invariant }>`;
	}

	public override includes(v: VALUE.Value): boolean {
		return v instanceof VALUE.List && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeDeco
	@referenceSubtypeDeco
	@instanceOf(() => List)
	public override isSubtypeOf(t: Type): boolean {
		return (
			(!t.isMutable || this.isMutable) &&
			(t.isMutable
				? this.invariant.equals((t as List).invariant)      // Invariance for mutable lists: `A == B --> mut List.<A> <: mut List.<B>`.
				: this.invariant.isSubtypeOf((t as List).invariant) // Covariance for immutable lists: `A <: B --> List.<A> <: List.<B>`.
			)
		);
	}

	public override mutableOf(): List {
		return new List(this.invariant, true);
	}

	public override immutableOf(): List {
		return new List(this.invariant, false);
	}
}
