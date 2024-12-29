import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.js';
import * as VALUE from '../cp-value/index.js';
import {MUT_OPERATOR} from './utils-private.js';
import {
	subtypeDeco,
	type Type,
} from './Type.js';
import {
	referenceSubtypeDeco,
	ReferenceType,
} from './ReferenceType.js';



/**
 * Class for constructing a `Dict` type.
 * @final
 */
export class Dict extends ReferenceType {
	/**
	 * Construct a new Dict object.
	 * @param invariant a union of types in this dict type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariant: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new VALUE.Dict()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariant.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? MUT_OPERATOR : '' }Dict.<${ this.invariant }>`;
	}

	public override includes(v: VALUE.Value): boolean {
		return v instanceof VALUE.Dict && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeDeco
	@referenceSubtypeDeco
	@instanceOf(() => Dict)
	public override isSubtypeOf(t: Type): boolean {
		return (
			(!t.isMutable || this.isMutable) &&
			(t.isMutable
				? this.invariant.equals((t as Dict).invariant)      // Invariance for mutable dicts: `A == B --> mut Dict.<A> <: mut Dict.<B>`.
				: this.invariant.isSubtypeOf((t as Dict).invariant) // Covariance for immutable dicts: `A <: B --> Dict.<A> <: Dict.<B>`.
			)
		);
	}

	public override mutableOf(): Dict {
		return new Dict(this.invariant, true);
	}

	public override immutableOf(): Dict {
		return new Dict(this.invariant, false);
	}
}
