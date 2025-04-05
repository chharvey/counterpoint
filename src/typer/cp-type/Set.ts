import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../cp-value/index.ts';
import {MUT_OPERATOR} from './utils-private.ts';
import {
	subtypeRules,
	type Type,
} from './Type.ts';
import {
	isObjectType,
	ReferenceType,
} from './ReferenceType.ts';



/**
 * Class for constructing a `Set` type.
 * @final
 */
class TypeSet extends ReferenceType {
	/**
	 * Construct a new TypeSet object.
	 * @param invariant a union of types in this set type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariant: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new VALUE.Set()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariant.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? MUT_OPERATOR : '' }Set.<${ this.invariant }>`;
	}

	public override includes(v: VALUE.Value): boolean {
		return v instanceof VALUE.Set && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeRules
	@isObjectType
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
export {TypeSet as Set};
