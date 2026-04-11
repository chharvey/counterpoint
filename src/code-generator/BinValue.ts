import binaryen from 'binaryen';
import {
	bigint_to_i64,
	type ReftypeKey,
	type Builder,
	BinVect,
} from '../index.ts';
import {STRUCT_FIELD} from './utils-public.ts';



/**
 * A WASM struct representing a Counterpoint Language Value.
 *
 * Corresponds to the `$Value` type defined in `types.wat` (the single source of truth).
 * This struct is an “**Either**” abstract data type with 3 fields:
 *
 * Name         | Type            | Description
 * ------------ | --------------- | -----------
 * `$tag`       | `i8`            | a 1 or 2, discriminating either a primitive value (1) or a composite value (2)
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
	 *               `(ref $Value)`, or `(ref null $Value)`, or a BinVect object,
	 *               or `null`
	 */
	public constructor(
		private readonly cg: Builder,
		arg: binaryen.ExpressionRef | BinVect | null,
	) {
		this.TYPE = cg.reftype.Value;
		if (arg instanceof BinVect) {
			this.value = new BinValue(cg, arg.vect).value;
			return;
		}
		if (arg === null) {
			this.value = cg.module.struct.new_default(cg.heaptype.Value);
			return;
		}
		switch (binaryen.getExpressionType(arg)) {
			case binaryen.unreachable: {
				this.value = arg;
				break;
			}
			// WARNING: leaky abstraction! bitwise-ORing with 4 provides the “exact” type, i.e. `(ref (exact $Value))` --- see WebAssembly/binaryen/src/wasm-type.h
			case cg.reftypeNull.Value | 4:
			case cg.reftype.Value     | 4:
			case cg.reftypeNull.Value:
			case cg.reftype.Value: { // if given a (nullish) `$Value`, just use that
				this.value = arg;
				break;
			}
			case binaryen.v128: { // a primitive
				this.value = cg.module.struct.new([
					cg.module.i32.const(1),
					arg,
					cg.module.ref.null(binaryen.eqref),
				], cg.heaptype.Value);
				break;
			}
			case binaryen.eqref:
			case cg.reftype.Tuple:
			case cg.reftype.Record:
			case cg.reftype.List:
			case cg.reftype.Dict:
			case cg.reftype.Object:
			default: { // a composite
				this.value = cg.module.struct.new([
					cg.module.i32.const(2),
					cg.module.v128.const(new Uint8Array(16)),
					arg,
				], cg.heaptype.Value);
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

	/** Whether the value is primitive (tag == 1). */
	public get isPrimitive(): binaryen.ExpressionRef {
		return this.cg.module.i32.eq(this.cg.module.struct.get(STRUCT_FIELD.VALUE_TAG, this.value, binaryen.i32, false), this.cg.module.i32.const(1));
	}

	/** Whether the value is composite (tag == 2). */
	public get isComposite(): binaryen.ExpressionRef {
		return this.cg.module.i32.eq(this.cg.module.struct.get(STRUCT_FIELD.VALUE_TAG, this.value, binaryen.i32, false), this.cg.module.i32.const(2));
	}

	/** The primitive value if it exists, otherwise a `(v128.const i64x2 0 0)`. */
	public get asPrimitive(): binaryen.ExpressionRef {
		return this.cg.module.struct.get(STRUCT_FIELD.VALUE_PRIMITIVE, this.value, binaryen.v128);
	}

	/** The composite value if it exists, otherwise a `(ref.null eq)`. */
	public get asComposite(): binaryen.ExpressionRef {
		return this.cg.module.struct.get(STRUCT_FIELD.VALUE_COMPOSITE, this.value, binaryen.eqref);
	}

	/** Wrap this `$Value` in a `$Property`, given a key id. */
	public toProperty(keyid: bigint): binaryen.ExpressionRef {
		return this.cg.module.struct.new([
			bigint_to_i64(this.cg.module, keyid, true),
			this.value,
		], this.cg.heaptype.Property);
	}

	/**
	 * Extracts this value’s `$primitive` field
	 * and interprets it as an `int`, `nat`, or `float`, depending on the argument.
	 * This method does not test the value’s `$tag` field — it assumes its `$primitive` field is filled.
	 * @param typekey the string key of the type to cast to; accessed on `BinVect`
	 * @return        `({i64x2,f64x2}.extract_lane 1 (struct.get $Value $primitive <this>))`
	 */
	public interpret(typekey: 'asSpecial' | 'asInt' | 'asNat' | 'asFloat'): binaryen.ExpressionRef {
		return new BinVect(this.cg.module, this.asPrimitive)[typekey];
	}

	/**
	 * Extracts this value’s `$composite` field and returns a `(ref.cast)` to the given reference type.
	 * This method does not test the value’s `$tag` field — it assumes its `$composite` field is filled.
	 * @param reftype the string key of the type to cast to
	 * @return        `(ref.cast (struct.get $Value $composite <this>) <reftype>)`
	 */
	public cast(reftype: ReftypeKey): binaryen.ExpressionRef {
		// TODO: update the argument to take any `binaryen.Type`
		const bintype: binaryen.Type = new Map<ReftypeKey, binaryen.Type>([
			['(ref $Value)',        this.cg.reftype.Value],
			['(ref $Property)',     this.cg.reftype.Property],
			['(ref $Case)',         this.cg.reftype.Case],
			['(ref $Tuple)',        this.cg.reftype.Tuple],
			['(ref $Record)',       this.cg.reftype.Record],
			['(ref $ListInternal)', this.cg.reftype.ListInternal],
			['(ref $DictInternal)', this.cg.reftype.DictInternal],
			['(ref $MapInternal)',  this.cg.reftype.MapInternal],
			['(ref $Object)',       this.cg.reftype.Object],
			['(ref $List)',         this.cg.reftype.List],
			['(ref $Dict)',         this.cg.reftype.Dict],
			['(ref $Map)',          this.cg.reftype.Map],
		]).get(reftype)!;
		return this.cg.module.ref.cast(this.asComposite, bintype);
	}
}
