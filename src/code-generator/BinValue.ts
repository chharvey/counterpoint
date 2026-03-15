import binaryen from 'binaryen';
import {
	type Builder,
	BinVect,
} from '../index.ts';



/**
 * A WASM struct representing a Counterpoint Language Value.
 *
 * Corresponds to the `$Value` type defined in `types.wat` (the single source of truth).
 * This struct is an “**Either**” abstract data type with 3 fields:
 *
 * Name         | Type            | Description
 * ------------ | --------------- | -----------
 * `$tag`       | `i8`            | a 0 or 1, discriminating either a primitive value (0) or a composite value (1)
 * `$primitive` | `v128`          | a union of primitive types specified by the {@link BinVect} class
 * `$composite` | `(ref null eq)` | an opaque reference pointing to a WASM struct/array. can be an `$Object` (or a subtype), a `$Tuple`, or a `$Record`. (see `types.wat`)
 */
export class BinValue {
	/** A WASM value of type `(ref $Value)`. */
	public readonly value: binaryen.ExpressionRef;

	/**
	 * The type of the WASM value.
	 * It is always type `(ref $Value)`, and is the same for every BinValue instance.
	 */
	public readonly TYPE: binaryen.Type;

	/**
	 * Construct a new BinValue object.
	 * @param  cg  a CodeGenerator to get the types
	 * @param  arg a Binaryen value of WASM type `v128`,
	 *               `(ref $Object)` or a subtype, `(ref $Tuple)`, `(ref $Record)`,
	 *               `(ref $Value)`, or `(ref null $Value)`
	 */
	public constructor(
		private readonly cg: Builder,
		arg: binaryen.ExpressionRef | BinVect,
	) {
		this.TYPE = cg.getReftype('(ref $Value)')!;
		if (arg instanceof BinVect) {
			this.value = arg.vect;
			return;
		}
		const ht_value: binaryen.Type = cg.getHeaptype('$Value')!;
		switch (binaryen.getExpressionType(arg)) {
			case cg.getReftype('(ref null $Value)')!: { // in case a nullish `$Value` gets wrapped
				// if arg is WASM null, return VALUE.NULL, else return the arg
				this.value = cg.module.if(
					cg.module.ref.is_null(arg),
					cg.module.struct.new([
						cg.module.i32.const(0),
						new BinVect(cg.module).vect, // VALUE.NULL.codegen(cg.module).vect
						cg.module.ref.null(binaryen.eqref),
					], ht_value),
					arg,
				);
				break;
			}
			case cg.getReftype('(ref $Value)')!: { // if given a `$Value`, just use that
				this.value = arg;
				break;
			}
			case binaryen.v128: { // a primitive
				this.value = cg.module.struct.new([
					cg.module.i32.const(0),
					arg,
					cg.module.ref.null(binaryen.eqref),
				], ht_value);
				break;
			}
			case cg.getReftype('(ref $Tuple)')!:
			case cg.getReftype('(ref $Record)')!:
			case cg.getReftype('(ref $List)')!:
			case cg.getReftype('(ref $Dict)')!:
			case cg.getReftype('(ref $Object)')!:
			default: { // a composite
				this.value = cg.module.struct.new([
					cg.module.i32.const(0),
					cg.module.v128.const(new Uint8Array(16)),
					arg,
				], ht_value);
				break;
			}
			/*
			default: {
				const expected_types = [
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

	/** Whether the value is primitive (tag == 0). */
	public get isPrimitive(): binaryen.ExpressionRef {
		return this.cg.module.i32.eqz(this.cg.module.struct.get(0, this.value, this.TYPE, false));
	}

	/** Whether the value is composite (tag == 1). */
	public get isComposite(): binaryen.ExpressionRef {
		return this.cg.module.i32.eqz(this.isPrimitive);
	}

	/** The primitive value if it exists, otherwise a `(v128.const 0)`. */
	public get primitiveValue(): binaryen.ExpressionRef {
		return this.cg.module.struct.get(1, this.value, this.TYPE);
	}

	/** The composite value if it exists, otherwise a `(ref.null eq)`. */
	public get compositeValue(): binaryen.ExpressionRef {
		return this.cg.module.struct.get(2, this.value, this.TYPE);
	}
}
