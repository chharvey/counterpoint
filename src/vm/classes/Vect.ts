import * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/**
 * A Binaryen vector (`v128`) representing one of the following:
 * - one of three primitive special constants, the Counterpoint values `null`, `false`, or `true`, as a value on the stack
 * - a numeric value of Counterpoint type `int`, `nat`, `dec`, or `float`, as a value on the stack
 *
 * # Layout
 * The 128-bit vector has 8 lanes (indexed 0–7, left-to-right), 16 bits each.
 * - Lanes 0–1 are always zero (reserved for future use).
 * - Lane 2 stores the **scaling factor** for `dec` values, which are not yet supported.
 * - Lane 3, the **header lane**, indicates the vector’s representation.
 * - Lanes 4–7, the **data lanes** hold the vector’s data.
 * 	Data is always left-aligned, stored in little-endian format (by byte).
 * 	(E.g., an `i32` of value `\x05060708` would be stored as `\x0807 \x0605` in Lanes 4–5.)
 *
 * # Header Lane
 * Lane 3 must be one of the following values:
 *
 * Value    | Description
 * -------- | -----------
 * `\x0000` | The vector is in its default state, having no value.
 * `\x0001` | The vector represents the `null`  primitive constant.
 * `\x0002` | The vector represents the `false` primitive constant.
 * `\x0003` | The vector represents the `true`  primitive constant.
 * `\x0012` | The vector holds an `i16` value, representing a signed integer.
 * `\x0014` | The vector holds an `i32` value, representing a signed integer.
 * `\x0018` | The vector holds an `i64` value, representing a signed integer.
 * `\x0022` | The vector holds an `i16` value, representing an unsigned integer.
 * `\x0024` | The vector holds an `i32` value, representing an unsigned integer.
 * `\x0028` | The vector holds an `i64` value, representing an unsigned integer.
 * `\x0032` | The vector holds an `i16` value, representing a fixed-precision decimal value (with a scaling factor).
 * `\x0034` | The vector holds an `i32` value, representing a fixed-precision decimal value (with a scaling factor).
 * `\x0038` | The vector holds an `i64` value, representing a fixed-precision decimal value (with a scaling factor).
 * `\x0042` | The vector holds an `f16` value, representing a floating-point binary value.
 * `\x0044` | The vector holds an `f32` value, representing a floating-point binary value.
 * `\x0048` | The vector holds an `f64` value, representing a floating-point binary value.
 *
 * # Value Types
 * ## Special Constants
 * When the Header is `\x0000`–`\x0003`, it represents a special constant (or lack thereof).
 * The represented constant is indicated by the Header’s value, as described above.
 * For no value (header `\x0000`), behavior is undefined.
 * Lanes 4–7 are ignored.
 *
 * ## Signed Integer Values
 * When the Header is `\x0012`, `\x0014`, or `\x0018`, it represents an `i16`, `i32`, or `i64` value respectively,
 * which must be interpreted as signed.
 * Currently, only `i64` values are used.
 * Lanes 4–7 together form the `i64` value, stored in little-endian format.
 * Header values of `\x0012` and `\x0014` reserved for future use.
 *
 * ## Unsigned Integer Values
 * When the Header is `\x0022`, `\x0024`, or `\x0028`, it represents an `i16`, `i32`, or `i64` value respectively,
 * which must be interpreted as unsigned.
 * Currently, only `i64` values are used.
 * Lanes 4–7 together form the `i64` value, stored in little-endian format.
 * Header values of `\x0022` and `\x0024` reserved for future use.

 * ## Decimal Values
 * Header values `\x0030`–`\x003f` are reserved. Decimal values are not yet supported.
 * Lane 2, the scaling factor, will be applicable for this type. Currently it is unused.
 *
 * ## Float Values
 * When the Header is `\x0042`, `\x0044`, or `\x0048`, it represents an `f16`, `f32`, or `f64` value respectively.
 * Currently, only `f64` values are used.
 * Lanes 4–7 together form the `f64` value, stored in little-endian format.
 * Header values of `\x0042` and `\x0044` reserved for future use.
 *
 * The following diagram may prove useful:
 * ```
 *                     Lane 0 Lane 1 Lane 2 Lane 3 | Lane 4 Lane 5 Lane 6 Lane 7
 *                       ----   ----   ----   ---- |   ----   ----   ----   ----
 * No value (default): \x0000 \x0000 \x0000 \x0000 | \x0000 \x0000 \x0000 \x0000
 * null:               \x0000 \x0000 \x0000 \x0001 | \x0000 \x0000 \x0000 \x0000
 * false:              \x0000 \x0000 \x0000 \x0002 | \x0000 \x0000 \x0000 \x0000
 * true:               \x0000 \x0000 \x0000 \x0003 | \x0000 \x0000 \x0000 \x0000
 * signed i16:         \x0000 \x0000 \x0000 \x0012 | \x???? \x0000 \x0000 \x0000
 * signed i32:         \x0000 \x0000 \x0000 \x0014 | \x???? \x???? \x0000 \x0000
 * signed i64:         \x0000 \x0000 \x0000 \x0018 | \x???? \x???? \x???? \x????
 * unsigned i16:       \x0000 \x0000 \x0000 \x0022 | \x???? \x0000 \x0000 \x0000
 * unsigned i32:       \x0000 \x0000 \x0000 \x0024 | \x???? \x???? \x0000 \x0000
 * unsigned i64:       \x0000 \x0000 \x0000 \x0028 | \x???? \x???? \x???? \x????
 * reserved:           \x0000 \x0000 \x???? \x0032 | \x???? \x0000 \x0000 \x0000
 * reserved:           \x0000 \x0000 \x???? \x0034 | \x???? \x???? \x0000 \x0000
 * reserved:           \x0000 \x0000 \x???? \x0038 | \x???? \x???? \x???? \x????
 * f16:                \x0000 \x0000 \x0000 \x0042 | \x???? \x0000 \x0000 \x0000
 * f32:                \x0000 \x0000 \x0000 \x0044 | \x???? \x???? \x0000 \x0000
 * f64:                \x0000 \x0000 \x0000 \x0048 | \x???? \x???? \x???? \x????
 * ```
 */
export class Vect implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
			['Vect#newInt',   {name: 'Vect.new-int',   param: binaryen.i64,  result: binaryen.v128}],
			['Vect#newNat',   {name: 'Vect.new-nat',   param: binaryen.i64,  result: binaryen.v128}],
			['Vect#newFloat', {name: 'Vect.new-float', param: binaryen.f64,  result: binaryen.v128}],
			['Vect#isNull',   {name: 'Vect.is-null',   param: binaryen.v128, result: binaryen.i32}],
			['Vect#isFalse',  {name: 'Vect.is-false',  param: binaryen.v128, result: binaryen.i32}],
			['Vect#isTrue',   {name: 'Vect.is-true',   param: binaryen.v128, result: binaryen.i32}],
			['Vect#isInt',    {name: 'Vect.is-int',    param: binaryen.v128, result: binaryen.i32}],
			['Vect#isNat',    {name: 'Vect.is-nat',    param: binaryen.v128, result: binaryen.i32}],
			['Vect#isFloat',  {name: 'Vect.is-float',  param: binaryen.v128, result: binaryen.i32}],
			['Vect#asInt',    {name: 'Vect.as-int',    param: binaryen.v128, result: binaryen.i64}],
			['Vect#asNat',    {name: 'Vect.as-nat',    param: binaryen.v128, result: binaryen.i64}],
			['Vect#asFloat',  {name: 'Vect.as-float',  param: binaryen.v128, result: binaryen.f64}],
		]);
	}

	public get VOID():  binaryen.ExpressionRef /* v128 */ { return this.vm.mod.wasm.global.get('Vect.VOID',  binaryen.v128); }
	public get NULL():  binaryen.ExpressionRef /* v128 */ { return this.vm.mod.wasm.global.get('Vect.NULL',  binaryen.v128); }
	public get FALSE(): binaryen.ExpressionRef /* v128 */ { return this.vm.mod.wasm.global.get('Vect.FALSE', binaryen.v128); }
	public get TRUE():  binaryen.ExpressionRef /* v128 */ { return this.vm.mod.wasm.global.get('Vect.TRUE',  binaryen.v128); }


	/** Returns a v128 encoding the given i64 as signed. */
	public newInt(int: binaryen.ExpressionRef /* i64 */): binaryen.ExpressionRef /* v128 */ {
		return this.vm.mod.wasm.call('Vect.new-int', [int], binaryen.v128);
	}

	/** Returns a v128 encoding the given i64 as unsigned. */
	public newNat(nat: binaryen.ExpressionRef /* i64 */): binaryen.ExpressionRef /* v128 */ {
		return this.vm.mod.wasm.call('Vect.new-nat', [nat], binaryen.v128);
	}

	/** Returns a v128 encoding the given f64. */
	public newFloat(float: binaryen.ExpressionRef /* f64 */): binaryen.ExpressionRef /* v128 */ {
		return this.vm.mod.wasm.call('Vect.new-float', [float], binaryen.v128);
	}

	/**
	 * Whether the value contains the encoding for one of the Counterpoint values `null`, `false`, or `true`.
	 * @param vect the parameter to send into the WASM function
	 * @param tag    determines which WASM function to call
	 * @returns      the result of calling `$Vect.is-{null,false,true}` based on the given tag
	 */
	public isConst(vect: binaryen.ExpressionRef /* v128 */, tag: boolean | null): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call(`Vect.is-${ tag }`, [vect], binaryen.i32);
	}

	/** Whether the value is intended to be interpreted as a signed integer. */
	public isInt(vect: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Vect.is-int', [vect], binaryen.i32);
	}

	/** Whether the value is intended to be interpreted as an unsigned integer. */
	public isNat(vect: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Vect.is-nat', [vect], binaryen.i32);
	}

	/** Whether the value is intended to be interpreted as a float. */
	public isFloat(vect: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Vect.is-float', [vect], binaryen.i32);
	}

	/** The value as interpreted as a signed integer. */
	public asInt(vect: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i64 */ {
		return this.vm.mod.wasm.call('Vect.as-int', [vect], binaryen.i64);
	}

	/** The value as interpreted as an unsigned integer. */
	public asNat(vect: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i64 */ {
		return this.vm.mod.wasm.call('Vect.as-nat', [vect], binaryen.i64);
	}

	/** The value as interpreted as a float. */
	public asFloat(vect: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* f64 */ {
		return this.vm.mod.wasm.call('Vect.as-float', [vect], binaryen.f64);
	}
}
