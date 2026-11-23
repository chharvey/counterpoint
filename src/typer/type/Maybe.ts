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
 * Class for constructing a `Maybe` type.
 * Known subclasses:
 * - None
 * - Some
 */
export class Maybe extends ReferenceType {
	/**
	 * Constructs a new Maybe object resembling the `Maybe[T]` type, with the given generic argument.
	 * @param typearg the generic argument to `Maybe[T]`
	 */
	public constructor(public readonly typearg: Type) {
		super();
	}


	public override toString(): string {
		return `Maybe[${this.typearg}]`;
	}

	@instanceOf(() => VALUE.Maybe)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@isObjectType
	@instanceOf(() => Maybe)
	public override isSubtypeOf(t: Type): boolean {
		return this.constructor === t.constructor && this.typearg.isSubtypeOf((t as Maybe).typearg); // Maybe is always covariant
	}

	/** @final */
	public override mutableOf(): this {
		return this;
	}
}



/**
 * Class for constructing a `None` type.
 * @final
 */
export class None extends Maybe {
	public override toString(): string {
		return `None[${this.typearg}]`;
	}

	@instanceOf(() => VALUE.None)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@isObjectType
	@instanceOf(() => Maybe)
	public override isSubtypeOf(t: Type): boolean {
		return t instanceof None
			? this.typearg.isSubtypeOf(t.typearg) // None is always covariant
			: new Maybe(this.typearg).isSubtypeOf(t);
	}
}



/**
 * Class for constructing a `Some` type.
 * @final
 */
export class Some extends Maybe {
	public override toString(): string {
		return `Some[${this.typearg}]`;
	}

	@instanceOf(() => VALUE.Some)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@isObjectType
	@instanceOf(() => Maybe)
	public override isSubtypeOf(t: Type): boolean {
		return t instanceof Some
			? this.typearg.isSubtypeOf(t.typearg) // Some is always covariant
			: new Maybe(this.typearg).isSubtypeOf(t);
	}
}
