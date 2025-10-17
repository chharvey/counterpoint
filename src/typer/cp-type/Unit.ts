import * as assert from 'node:assert';
import {
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../cp-value/index.ts';
import {
	NULL,
	BOOL,
	SYM,
	INT,
	FLOAT,
	STR,
} from './index.ts';
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
export class Unit<T extends VALUE.Primitive = VALUE.Primitive> extends ValueType {
	/**
	 * Construct a new Unit object.
	 * @param value the Counterpoint Language Value contained in this Type
	 */
	public constructor(public readonly value: T) {
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

	/**
	 * Return the narrowest primitive type containing this type unit.
	 * @return a Counterpoint type `null`, `bool`, `sym`, `int`, `float`, or `str`
	 */
	public primitiveType(): Type {
		return (
			this.value instanceof VALUE.Null    ? NULL :
			this.value instanceof VALUE.Boolean ? BOOL :
			this.value instanceof VALUE.Symbol  ? SYM :
			this.value instanceof VALUE.Integer ? INT :
			this.value instanceof VALUE.Float   ? FLOAT :
			this.value instanceof VALUE.String  ? STR :
			assert.fail(`Expected ${ this.value } to be a primitive value.`)
		);
	}
}
