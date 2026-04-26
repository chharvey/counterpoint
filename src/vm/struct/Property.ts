import binaryen from 'binaryen';
import {bigint_to_i64} from '../../index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$Property.$key` */ KEY: 0,
	/** `$Property.$val` */ VAL: 1,
} as const;



export class Property {
	public constructor(private readonly vm: VirtualMachine) {}


	/** Create a `$Property` struct containing a `$Value` argument and the given key. */
	public new(key: bigint, arg: binaryen.ExpressionRef /* unreachable | (ref $Value) | (ref null $Value) */): binaryen.ExpressionRef /* (ref $Property) */ {
		switch (binaryen.getExpressionType(arg)) {
			case binaryen.unreachable: {
				return arg;
			}
			// WARNING: leaky abstraction! bitwise-ORing with 4 provides the “exact” type, i.e. `(ref (exact $Value))` --- see WebAssembly/binaryen/src/wasm-type.h
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			case binaryen.nullref: // `(ref null none)` // BUG: Binaryen treats all nullish values the same. See NOTE below.
			case this.vm.reftypeNull.Value | 4:
			case this.vm.reftype.Value     | 4:
			case this.vm.reftypeNull.Value:
			case this.vm.reftype.Value:
			default: {
				/* NOTE: If the expression type is `binaryen.nullref`, we’re assuming a `(ref null $Value)` was given.
				But in case a `(ref null $Case)`, etc. is given, an `(unreachable)` should be returned, since those aren’t valid in a `$Property` struct.
				Since Binaryen considers all nullish values to be `nullref`, we can’t make that distinction. */
				return this.vm.mod.struct.new([
					bigint_to_i64(this.vm.mod, key, true),
					arg,
				], this.vm.heaptype.Property);
			}
		}
	}

	public field(ref: binaryen.ExpressionRef /* (ref null $Property) */): {
		readonly key: binaryen.ExpressionRef /* i64 */,
		readonly val: binaryen.ExpressionRef /* (ref $Value) */,
	} {
		const {mod, reftype} = this.vm;
		/* eslint-disable @stylistic/brace-style */
		return {
			/** @return `(struct.get $Property $key <ref>)` */ get key() { return mod.struct.get(FIELD.KEY, ref, binaryen.i64); },
			/** @return `(struct.get $Property $val <ref>)` */ get val() { return mod.struct.get(FIELD.VAL, ref, reftype.Value); },
		};
		/* eslint-enable @stylistic/brace-style */
	}
}
