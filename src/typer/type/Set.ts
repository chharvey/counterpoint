import {Keyword} from '../../index.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {
	subtypeLaws,
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
	 * @param typearg a union of types in this set type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly typearg: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable);
	}

	public override toString(): string {
		return `${ this.isMutable ? `${ Keyword.MUTABLE } ` : '' }Set.<${ this.typearg }>`;
	}

	@instanceOf(() => VALUE.Set)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@isObjectType
	@instanceOf(() => TypeSet)
	public override isSubtypeOf(t: Type): boolean {
		return t.isMutable
			? this.typearg.equals((t as TypeSet).typearg)       // Invariance for   mutable sets: `A == B --> mut Set.<A> <: mut Set.<B>`.
			: this.typearg.isSubtypeOf((t as TypeSet).typearg); // Covariance for immutable sets: `A <: B -->     Set.<A> <:     Set.<B>`.
	}

	public override mutableOf(): TypeSet {
		return new TypeSet(this.typearg, true);
	}

	public override immutableOf(): TypeSet {
		return new TypeSet(this.typearg, false);
	}
}
export {TypeSet as Set};
