import {
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import type * as VALUE from '../cp-value/index.ts';
import {
	subtypeRules,
	type Type,
} from './Type.ts';
import {ValueType} from './ValueType.ts';



/**
 * Class for constructing unit types, types that contain exactly one value.
 * @typeparam Value the type of value this unit type holds
 * @final
 */
export class Unit<Value extends VALUE.Primitive = VALUE.Primitive> extends ValueType {
	/**
	 * Construct a new Unit object.
	 * @param value the Counterpoint Language Value contained in this Type
	 */
	public constructor(public readonly value: Value) {
		super(false, new Set([value]));
	}

	public override toString(): string {
		return this.value.toString();
	}

	public override includes(v: VALUE.Value): boolean {
		return this.value.identical(v);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeRules
	public override isSubtypeOf(t: Type): boolean {
		return t.includes(this.value);
	}
}
