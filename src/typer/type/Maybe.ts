import {Validator} from '../../index.ts';
import {memoizeGetter} from '../../lib/index.ts';
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
	/** Enumeration of the properties of the `Maybe` type precursor. */
	// need to use a getter due to import order
	@memoizeGetter
	public static get MAYBE_PROPS() { // eslint-disable-line @typescript-eslint/explicit-function-return-type
		const key_is_maybe = '\'%isMaybe\'';
		const key_value    = '\'%value\'';
		return {
			isMaybe: {name: key_is_maybe, id: Validator.cookTokenIdentifier(key_is_maybe)},
			value:   {name: key_value,    id: Validator.cookTokenIdentifier(key_value)},
		} as const;
	}


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
