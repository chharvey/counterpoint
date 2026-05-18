import binaryen from 'binaryen';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$Object.$id` */
	ID: 0,
} as const;



/** Precursor to the Counterpoint `Object` class. */
class VmObject implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
		]);
	}

	/** Global counter for `$Object` structs. Used for values of field `$Object.$id`. */
	public get ctr(): binaryen.ExpressionRef /* i64 */ {
		return this.vm.mod.global.get('Object.ctr', binaryen.i64);
	}


	public field(ref: binaryen.ExpressionRef /* (ref null $Object) */): {
		/** @return `(struct.get $Object $id <ref>)` */
		readonly id: binaryen.ExpressionRef /* i64 */,
	} {
		const {mod} = this.vm;
		return {
			get id() {
				return mod.struct.get(FIELD.ID, ref, binaryen.i64);
			},
		};
	}

	/**
	 * Increments the value of `$Object.ctr`, but then returns its pre-incremented value.
	 * Equivalent to `ctr++` in most imperative languages.
	 */
	public ctrPlusPlus(): binaryen.ExpressionRef /* i64 */ {
		return this.vm.mod.call('Object.ctr-plus-plus', [], binaryen.i64);
	}
}
export {VmObject as Object};
