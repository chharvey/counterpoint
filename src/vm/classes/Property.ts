import * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$Property.$key` */ KEY: 0,
	/** `$Property.$val` */ VAL: 1,
} as const;



/** An entry in a record/Dict. */
export class Property implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
			['Property#isTombstone', {name: 'Property.is-tombstone', param: this.vm.reftypeNull.Property, result: binaryen.i32}],
		]);
	}


	/** @deprecated TODO: This is dead code. Remove when removing Case class. */
	public field(ref: binaryen.ExpressionRef /* (ref null $Property) */): {
		/** @return `(struct.get $Property $key <ref>)` */ readonly key: binaryen.ExpressionRef /* i64 */,
		/** @return `(struct.get $Property $val <ref>)` */ readonly val: binaryen.ExpressionRef /* (ref $Value) */,
	} {
		const {mod: {wasm}, reftype} = this.vm;
		return {
			get key() { return wasm.struct.get(FIELD.KEY, ref, binaryen.i64); },
			get val() { return wasm.struct.get(FIELD.VAL, ref, reftype.Value); },
		};
	}

	/**
	 * Returns whether a Property is a “tombstone”, that is, whether it represents a deletion in a Dict.
	 *
	 * Property tombstones are used when deleting Dict entries so as not to break linear probing chains.
	 * They may be returned when looking up a key for which an entry has since been deleted.
	 * Application code should treat tombstones as non-entries —
	 * they should be treated the same as null when getting, and should be replaced when setting.
	 *
	 * A Property tombstone is implemented as a Property with a key of `\xff`.
	 * This will not conflict with real Properties, whose keys are all at least `\x100`
	 * per the Counterpoint spec (see **TokenWorth** algorithm).
	 *
	 * Property tombstones contribute to the load factor of a Dict:
	 * they are counted when determining when a Dict’s array should be grown or shrunk.
	 * When growing/shrinking an array, tombstones are not copied over to the new array.
	 * @deprecated TODO: This is dead code. Remove when removing Case class.
	 */
	public isTombstone(prop: binaryen.ExpressionRef /* (ref null $Property) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Property.is-tombstone', [prop], binaryen.i32);
	}
}
