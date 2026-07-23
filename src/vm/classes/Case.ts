import * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$Case.$ant` */ ANT: 0,
	/** `$Case.$con` */ CON: 1,
} as const;



/** An entry in a Map. */
export class Case implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
			['Case#isTombstone', {name: 'Case.is-tombstone', param: this.vm.reftypeNull.Case, result: binaryen.i32}],
		]);
	}


	public field(ref: binaryen.ExpressionRef /* (ref null $Case) */): {
		/** @return `(struct.get $Case $ant <ref>)` */ readonly ant: binaryen.ExpressionRef /* (ref $Value) */,
		/** @return `(struct.get $Case $con <ref>)` */ readonly con: binaryen.ExpressionRef /* (ref $Value) */,
	} {
		const {mod: {wasm}, reftype} = this.vm;
		return {
			get ant() { return wasm.struct.get(FIELD.ANT, ref, reftype.Value); },
			get con() { return wasm.struct.get(FIELD.CON, ref, reftype.Value); },
		};
	}

	/**
	 * Returns whether a Case is a “tombstone”, that is, whether it represents a deletion in a Map.
	 *
	 * Case tombstones are used when deleting Map entries so as not to break linear probing chains.
	 * They may be returned when looking up an antecedent for which an entry has since been deleted.
	 * Application code should treat tombstones as non-entries —
	 * they should be treated the same as null when getting, and should be replaced when setting.
	 *
	 * A Case tombstone is implemented as a pair of Values both with a tag of `0`.
	 * This will not conflict with real Cases, pairs of Values whose tags are `1` or `2`.
	 * (A case containing one Value with a tag of `1` or `2` and one with a tag of `0` is not a valid Case.)
	 *
	 * Case tombstones contribute to the load factor of a Map:
	 * they are counted when determining when a Map’s array should be grown or shrunk.
	 * When growing/shrinking an array, tombstones are not copied over to the new array.
	 */
	public isTombstone(case_: binaryen.ExpressionRef /* (ref null $Case) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Case.is-tombstone', [case_], binaryen.i32);
	}
}
