import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {ANYTHING} from './index.ts';
import {
	subtypeLaws,
	type Type,
} from './Type.ts';
import {
	isObjectType,
	ReferenceType,
} from './ReferenceType.ts';



/**
 * A `Maybe` repesents presence or absence of a value.
 */
export class Maybe extends ReferenceType {
	/**
	 * Constructs a Record type resembling the `Maybe[T]` type, with the given generic argument.
	 * @param typearg the generic argument to `Maybe[T]`
	 */
	public constructor(public readonly typearg: Type) {
		super(new Set<VALUE.Maybe>([new VALUE.Maybe(ANYTHING)]));
	}


	public override toString(): string {
		return `Maybe[${ this.typearg }]`;
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
		return this.typearg.isSubtypeOf((t as Maybe).typearg); // Maybe is always covariant
	}
}



export class None extends Maybe {
	public override toString(): string {
		return `None[${ this.typearg }]`;
	}

	public override isSubtypeOf(t: Type): boolean {
		return super.isSubtypeOf(t) && t instanceof None;
	}
}

export class Some extends Maybe {
	public override toString(): string {
		return `Some[${ this.typearg }]`;
	}

	public override isSubtypeOf(t: Type): boolean {
		return super.isSubtypeOf(t) && t instanceof Some;
	}
}
