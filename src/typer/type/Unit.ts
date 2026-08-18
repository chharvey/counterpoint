import {
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import type * as VALUE from '../value/index.ts';
import {
	subtypeLaws,
	disjointLaws,
	type Type,
} from './Type.ts';
import {ValueType} from './ValueType.ts';



/**
 * Class for constructing unit types, types that contain exactly one value.
 * @typeparam T the type of value this unit type holds
 * @final
 */
export class Unit<T extends VALUE.Primitive = VALUE.Primitive> extends ValueType {
	/**
	 * Construct a new Unit object.
	 * @param value the Counterpoint Language Value contained in this Type
	 */
	public constructor(public readonly value: T) {
		super();
	}

	public override toString(): string {
		return this.value.toString();
	}

	public override includes(v: VALUE.Value): boolean {
		return this.value.identical(v);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	public override isSubtypeOf(t: Type): boolean {
		return t.includes(this.value);
	}

	@memoizeBinOp(true)
	@disjointLaws
	public override isDisjointWith(t: Type): boolean {
		return !this.isSubtypeOf(t);
	}
}
