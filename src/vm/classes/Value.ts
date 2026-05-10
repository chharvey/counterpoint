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


	/** Creates a new Value struct storing the given v128 in its primitive slot. */
	public newPrimitive(param0: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.call('Value.new-primitive', [param0], this.vm.reftype.Value);
	}

	/** Creates a new Value struct storing the given reference in its composite slot. */
	public newComposite(param0: binaryen.ExpressionRef /* (ref eq) */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.call('Value.new-composite', [param0], this.vm.reftype.Value);
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
