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
 * Class for constructing a `List` type.
 * @final
 */
export class List extends ReferenceType {
	/**
	 * Construct a new List object.
	 * @param typearg a union of types in this list type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly typearg: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable);
	}

	public override toString(): string {
		return `${ this.isMutable ? `${ Keyword.MUTABLE } ` : '' }List.<${ this.typearg }>`;
	}

	@instanceOf(() => VALUE.List)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@isObjectType
	@instanceOf(() => List)
	public override isSubtypeOf(t: Type): boolean {
		return t.isMutable
			? this.typearg.equals((t as List).typearg)       // Invariance for   mutable lists: `A == B --> mut List.<A> <: mut List.<B>`.
			: this.typearg.isSubtypeOf((t as List).typearg); // Covariance for immutable lists: `A <: B -->     List.<A> <:     List.<B>`.
	}

	public override mutableOf(): List {
		return new List(this.typearg, true);
	}

	public override immutableOf(): List {
		return new List(this.typearg, false);
	}
}
