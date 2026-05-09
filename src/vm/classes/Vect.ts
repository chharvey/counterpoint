import binaryen from 'binaryen';
import type {VirtualMachine} from '../VirtualMachine.ts';



export class Vect {
	public constructor(private readonly vm: VirtualMachine) {}


	/**
	 * Return a `v128` representing the argument.
	 * @param arg one of the following:
	 *             - the native value `null`, `false`, or `true` (corresponding to its representation)
	 *             - a Binaryen `i64`, `f64`, or `v128` value to use in a `v128`
	 * @param opts an object:
	 * 	@property `unsigned` - if `arg` is an `i64`, should it be interpreted as unsigned? (default `false`)
	 * 	@property `scale`    - the scale factor for decimal values (default `undefined`) — currently not supported
	 */
	public new(
		arg:  null | boolean | binaryen.ExpressionRef /* unreachable | i64 | f64 | v128 */,
		opts: {unsigned?: boolean, scale?: bigint} = {},
	): binaryen.ExpressionRef /* v128 */ {
		const {mod} = this.vm;
		switch (arg) {
			case null:  { return mod.global.get('Vect.NULL',  binaryen.v128); }
			case false: { return mod.global.get('Vect.FALSE', binaryen.v128); }
			case true:  { return mod.global.get('Vect.TRUE',  binaryen.v128); }
		}
		switch (binaryen.getExpressionType(arg)) {
			case binaryen.v128: {
				return arg;
			}
			case binaryen.unreachable: {
				return arg;
			}
			case binaryen.i64: {
				return opts.unsigned
					? mod.call('Vect.new-nat', [arg], binaryen.v128)
					: mod.call('Vect.new-int', [arg], binaryen.v128);
			}
			case binaryen.f64: {
				return mod.call('Vect.new-float', [arg], binaryen.v128);
			}
			default: {
				throw new TypeError(`Expected argument \`${ binaryen.emitText(arg) }\` to be one of the following types:\n\t${ [
					'`unreachable`',
					'`i64`',
					'`f64`',
				].join('\n\t') }.`);
			}
		}
	}


	/** The Header Lane’s value, indicating the type of data stored. */
	public type(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.call('Vect.type', [param0], binaryen.i32);
	}

	/** Whether the Header Lane is within a given range (inclusive). */
	public checkTypeRange(param0: binaryen.ExpressionRef /* v128 */, param1: binaryen.ExpressionRef /* i32 */, param2: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef {
		return this.vm.mod.call('Vect.check-type-range', [param0, param1, param2], binaryen.i32);
	}

	/** Whether the value does not exist */
	public isVoid(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.call('Vect.is-void', [param0], binaryen.i32);
	}

	/**
	 * Whether the value contains the encoding for one of the Counterpoint values `null`, `false`, or `true`.
	 * @param param0 the parameter to send into the WASM function
	 * @param tag    determines which WASM function to call
	 * @returns      the result of calling `$Vect.is-{null,false,true}` based on the given tag
	 */
	public isConst(param0: binaryen.ExpressionRef /* v128 */, tag: boolean | null): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.call(`Vect.is-${ tag }`, [param0], binaryen.i32);
	}

	/** Whether the value is intended to be interpreted as a special value: null, false, or true. */
	public isSpecial(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.call('Vect.is-special', [param0], binaryen.i32);
	}

	/** Whether the value is intended to be interpreted as a signed integer. */
	public isInt(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.call('Vect.is-int', [param0], binaryen.i32);
	}

	/** Whether the value is intended to be interpreted as an unsigned integer. */
	public isNat(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.call('Vect.is-nat', [param0], binaryen.i32);
	}

	/** Whether the value is intended to be interpreted as a float. */
	public isFloat(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.call('Vect.is-float', [param0], binaryen.i32);
	}

	/** The value as interpreted as a signed integer. */
	public asInt(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i64 */ {
		return this.vm.mod.call('Vect.as-int', [param0], binaryen.i64);
	}

	/** The value as interpreted as an unsigned integer. */
	public asNat(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i64 */ {
		return this.vm.mod.call('Vect.as-nat', [param0], binaryen.i64);
	}

	/** The value as interpreted as a float. */
	public asFloat(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* f64 */ {
		return this.vm.mod.call('Vect.as-float', [param0], binaryen.f64);
	}

	/** Reinterpretation. Return the `int` value, reinterpreted as `nat`. */
	public intToNat(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i64 */ {
		return this.vm.mod.call('Vect.int-to-nat', [param0], binaryen.i64);
	}

	/** Conversion. Return the `int` value, converted to `float`. */
	public intToFloat(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* f64 */ {
		return this.vm.mod.call('Vect.int-to-float', [param0], binaryen.f64);
	}

	/** Reinterpretation. Return the `nat` value, reinterpreted as `int`. */
	public natToInt(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i64 */ {
		return this.vm.mod.call('Vect.nat-to-int', [param0], binaryen.i64);
	}

	/** Conversion. Return the `nat` value, converted to `float`. */
	public natToFloat(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* f64 */ {
		return this.vm.mod.call('Vect.nat-to-float', [param0], binaryen.f64);
	}

	/** Truncation. Return the `float` value, truncated to `int`. */
	public floatToInt(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i64 */ {
		return this.vm.mod.call('Vect.float-to-int', [param0], binaryen.i64);
	}

	/** Truncation. Return the `float` value, truncated to `nat`. */
	public floatToNat(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* i64 */ {
		return this.vm.mod.call('Vect.float-to-nat', [param0], binaryen.i64);
	}
}
