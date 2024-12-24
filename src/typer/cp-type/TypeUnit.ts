import {
	strictEqual,
	memoizeBinOp,
} from '../../lib/index.js';
import type * as VALUE from '../cp-value/index.js';
import {subtypeDeco} from './decorators.js';
import type {Type} from './Type.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing unit types, types that contain exactly one value.
 * @typeparam Value the type of value this unit type holds
 * @final
 */
export class TypeUnit<Value extends VALUE.Primitive = VALUE.Primitive> extends ValueType {
	/**
	 * Construct a new TypeUnit object.
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
	@subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.includes(this.value);
	}
}
