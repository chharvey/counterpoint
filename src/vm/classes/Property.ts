import type * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** An entry in a record/Dict. */
export class Property implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
		]);
	}


	/**
	 * A Property “tombstone” represents a deletion in a Dict.
	 *
	 * Property tombstones are used when deleting Dict entries so as not to break linear probing chains.
	 * They may be returned when looking up a key for which an entry has since been deleted.
	 * Application code should treat tombstones as non-entries —
	 * they should be treated the same as null when getting, and should be replaced when setting.
	 *
	 * A Property tombstone is implemented as a Property with a key of `\x7f`.
	 * This will not conflict with real Properties, whose keys are all at least `\x80`
	 * per the Counterpoint spec (see **TokenWorth** algorithm).
	 *
	 * Property tombstones contribute to the load factor of a Dict:
	 * they are counted when determining when a Dict’s array should be grown or shrunk.
	 * When growing/shrinking an array, tombstones are not copied over to the new array.
	 */
	public get TOMBSTONE(): binaryen.ExpressionRef /* (ref $Property) */ {
		return this.vm.mod.wasm.global.get('Property.TOMBSTONE', this.vm.reftype.Property);
	}
}
