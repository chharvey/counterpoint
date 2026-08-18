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
 * Class for constructing a `Dict` type.
 * @final
 */
export class Dict extends ReferenceType {
	/**
	 * Construct a new Dict object.
	 * @param typearg a union of types in this dict type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly typearg: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable);
	}

	public override toString(): string {
		return `${ this.isMutable ? `${ Keyword.MUTABLE } ` : '' }Dict.<${ this.typearg }>`;
	}

	@instanceOf(() => VALUE.Dict)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@isObjectType
	@instanceOf(() => Dict)
	public override isSubtypeOf(t: Type): boolean {
		return t.isMutable
			? this.typearg.equals((t as Dict).typearg)       // Invariance for   mutable dicts: `A == B --> mut Dict.<A> <: mut Dict.<B>`.
			: this.typearg.isSubtypeOf((t as Dict).typearg); // Covariance for immutable dicts: `A <: B -->     Dict.<A> <:     Dict.<B>`.
	}

	public override mutableOf(): Dict {
		return new Dict(this.typearg, true);
	}

	public override immutableOf(): Dict {
		return new Dict(this.typearg, false);
	}
}
