import type binaryen from 'binaryen';
import {
	bigint_to_i64,
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
	 *               or `null` (to create a `(struct.new_default)`)
	 */
	public constructor(
		private readonly cg: Builder,
		arg: binaryen.ExpressionRef | BinVect | null,
	) {
		this.TYPE = cg.reftype.Value;
		if (arg instanceof BinVect) {
			this.value = cg.vm.Value.new(arg.vect);
			return;
		}
		if (arg === null) {
			this.value = cg.vm.Value.new(arg);
			return;
		}
		this.value = cg.vm.Value.new(arg);
	}

	/** The primitive value if it exists, otherwise a `(v128.const i64x2 0 0)`. */
	private get asPrimitive(): binaryen.ExpressionRef {
		return this.cg.structGet.value.primitive(this.value);
	}

	/** The composite value if it exists, otherwise a `(ref.null eq)`. */
	public get asComposite(): binaryen.ExpressionRef {
		return this.cg.structGet.value.composite(this.value);
	}

	/** Return a new BinVect containing this Value’s primitive value. */
	public toBinVect(): BinVect {
		return new BinVect(this.cg.module, this.asPrimitive);
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
		return this.toBinVect()[typekey];
	}

	/**
	 * Extracts this value’s `$composite` field and returns a `(ref.cast)` to the given reference type.
	 * This method does not test the value’s `$tag` field — it assumes its `$composite` field is filled.
	 * @param reftype the string key of the type to cast to
	 * @return        `(ref.cast (struct.get $Value $composite <this>) <reftype>)`
	 */
	public cast(reftype: binaryen.Type): binaryen.ExpressionRef {
		return this.cg.module.ref.cast(this.asComposite, reftype);
	}
}
