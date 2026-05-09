import binaryen from 'binaryen';
import type {VirtualMachine} from '../VirtualMachine.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$Value.$tag` */       TAG:       0,
	/** `$Value.$primitive` */ PRIMITIVE: 1,
	/** `$Value.$composite` */ COMPOSITE: 2,
} as const;



export class Value {
	public constructor(private readonly vm: VirtualMachine) {}


	/** Create a `$Value` struct containing the argument. */
	public new(arg: binaryen.ExpressionRef /* unreachable | v128 | eqref | (ref $Value) | (ref null $Value) */ | null): binaryen.ExpressionRef /* (ref $Value) */ {
		if (arg === null) {
			return this.vm.mod.struct.new_default(this.vm.heaptype.Value);
		}
		switch (binaryen.getExpressionType(arg)) {
			// WARNING: leaky abstraction! bitwise-ORing with 4 provides the “exact” type, i.e. `(ref (exact $Value))` --- see WebAssembly/binaryen/src/wasm-type.h
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			case binaryen.nullref: // `(ref null none)` // BUG: Binaryen treats all nullish values the same. See NOTE below.
			case this.vm.reftypeNull.Value | 4:
			case this.vm.reftype.Value     | 4:
			case this.vm.reftypeNull.Value:
			case this.vm.reftype.Value: { // if given a (nullish) `$Value`, just use that
				/* NOTE: If the expression type is `binaryen.nullref`, we’re assuming a `(ref null $Value)` was given.
				But in case a `(ref null $Property)`, etc. is given, a `(struct.new_default $Value)` should be returned, since those aren’t valid in a `$Value` struct.
				Since Binaryen considers all nullish values to be `nullref`, we can’t make that distinction. */
				return arg;
			}
			case binaryen.unreachable: {
				return arg;
			}
			case binaryen.v128: { // a primitive
				return this.vm.mod.struct.new([
					this.vm.mod.i32.const(1),
					arg,
					this.vm.mod.ref.null(binaryen.eqref),
				], this.vm.heaptype.Value);
			}
			case binaryen.eqref:
			case this.vm.reftype.String:
			case this.vm.reftype.Tuple:
			case this.vm.reftype.Record:
			case this.vm.reftype.Object:
			case this.vm.reftype.List:
			case this.vm.reftype.Dict:
			case this.vm.reftype.Map:
			default: { // a composite
				return this.vm.mod.struct.new([
					this.vm.mod.i32.const(2),
					this.vm.mod.v128.const(new Uint8Array(16)),
					arg,
				], this.vm.heaptype.Value);
			}
			/*
			default: {
				const expected_types = [
					'`unreachable`',
					'`v128`',
					'`(ref $Tuple)`',
					'`(ref $Record)`',
					'`(ref $Object)` or a subtype',
					'`(ref $Value)`',
					'`(ref null $Value)`',
				];
				throw new TypeError(`Expected argument \`${ binaryen.emitText(arg) }\` to be one of the following types:\n\t${ expected_types.join('\n\t') }`);
			}
			*/
		}
	}

	public field(ref: binaryen.ExpressionRef /* (ref null $Value) */): {
		readonly tag:       binaryen.ExpressionRef /* i32 */,
		readonly primitive: binaryen.ExpressionRef /* v128 */,
		readonly composite: binaryen.ExpressionRef /* eqref */,
	} {
		const {mod} = this.vm;
		return {
			/** @return `(struct.get $Value $tag       <ref>)` */ get tag():       binaryen.ExpressionRef /* i32   */ { return mod.struct.get(FIELD.TAG,       ref, binaryen.i32, false); },
			/** @return `(struct.get $Value $primitive <ref>)` */ get primitive(): binaryen.ExpressionRef /* v128  */ { return mod.struct.get(FIELD.PRIMITIVE, ref, binaryen.v128); },
			/** @return `(struct.get $Value $primitive <ref>)` */ get composite(): binaryen.ExpressionRef /* eqref */ { return mod.struct.get(FIELD.COMPOSITE, ref, binaryen.eqref); },
		};
	}

	/**
	 * Extracts a `$Value`’s `$composite` field and returns a `(ref.cast)` to the given reference type.
	 * This method does not test the value’s `$tag` field — it assumes its `$composite` field is filled.
	 * @param value   the expression to cast
	 * @param reftype the type to cast to
	 * @return        `(ref.cast (struct.get $Value $composite <value>) <reftype>)`
	 */
	public cast(value: binaryen.ExpressionRef /* (ref $Value) */, reftype: binaryen.Type): binaryen.ExpressionRef {
		return this.vm.mod.ref.cast(this.field(value).composite, reftype);
	}


	/** Whether the value is primitive (tag == 1). */
	public isPrimitive(param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.call('Value.is-primitive', [param0], binaryen.i32);
	}

	/** Whether the value is composite (tag == 2). */
	public isComposite(param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.call('Value.is-composite', [param0], binaryen.i32);
	}

	/** Converts this value (assuming it’s primitive and boolean) to i32. */
	public boolToI32(param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.call('Value.bool-to-i32', [param0], binaryen.i32);
	}

	/** Converts an i32 value to a $Value with a boolean primitive. */
	public boolFromI32(param0: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.call('Value.bool-from-i32', [param0], this.vm.reftype.Value);
	}
}
