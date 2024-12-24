import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../../lib/index.js';
import * as VALUE from '../cp-object/index.js';
import {
	subtypeDeco,
	referenceSubtypeDeco,
} from './decorators.js';
import {MUT_OPERATOR} from './utils-private.js';
import {Type} from './Type.js';



/**
 * Class for constructing a `List` type.
 * @final
 */
export class TypeList extends Type {
	/**
	 * Construct a new TypeList object.
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
	@instanceOf(() => TypeList)
	public override isSubtypeOf(t: Type): boolean {
		return (
			(!t.isMutable || this.isMutable) &&
			(t.isMutable
				? this.invariant.equals((t as TypeList).invariant)      // Invariance for mutable lists: `A == B --> mut List.<A> <: mut List.<B>`.
				: this.invariant.isSubtypeOf((t as TypeList).invariant) // Covariance for immutable lists: `A <: B --> List.<A> <: List.<B>`.
			)
		);
	}

	public override mutableOf(): TypeList {
		return new TypeList(this.invariant, true);
	}

	public override immutableOf(): TypeList {
		return new TypeList(this.invariant, false);
	}
}
