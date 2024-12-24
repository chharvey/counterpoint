import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../../lib/index.js';
import * as OBJ from '../cp-object/index.js';
import {MUT_OPERATOR} from './utils-private.js';
import {
	subtypeDeco,
	referenceSubtypeDeco,
} from './decorators.js';
import {Type} from './Type.js';



/**
 * Class for constructing a `Set` type.
 * @final
 */
export class TypeSet extends Type {
	/**
	 * Construct a new TypeSet object.
	 * @param invariant a union of types in this set type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariant: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.Set()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariant.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? MUT_OPERATOR : '' }Set.<${ this.invariant }>`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Set && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeDeco
	@referenceSubtypeDeco
	@instanceOf(() => TypeSet)
	public override isSubtypeOf(t: Type): boolean {
		return (
			(!t.isMutable || this.isMutable) &&
			(t.isMutable
				? this.invariant.equals((t as TypeSet).invariant) // Invariance for mutable sets: `A == B --> mut Set.<A> <: mut Set.<B>`.
				: this.invariant.equals((t as TypeSet).invariant) // Invariance for immutable sets: `A == B --> Set.<A> <: Set.<B>`.
			)
		);
	}

	public override mutableOf(): TypeSet {
		return new TypeSet(this.invariant, true);
	}

	public override immutableOf(): TypeSet {
		return new TypeSet(this.invariant, false);
	}
}
