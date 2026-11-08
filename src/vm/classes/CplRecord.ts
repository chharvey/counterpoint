import * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Struct field constant indices. */
const FIELD = {/** `$Cpl-Record.$record` */ RECORD: 0} as const;



export class CplRecord implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
			['CplRecord#hasKey', {
				name:   'Cpl-Record.has-key',
				param:  binaryen.createType([this.vm.reftype.CplRecord, binaryen.Type.i64]),
				result: binaryen.Type.i32,
			}],
			['CplRecord#get', {
				name:   'Cpl-Record.get',
				param:  binaryen.createType([this.vm.reftype.CplRecord, binaryen.Type.i64]),
				result: this.vm.reftype.Value,
			}],
		]);
	}


	public field(ref: binaryen.ExpressionRef /* (ref null $Cpl-Record) */): {/** @return `(struct.get $Cpl-Record $record <ref>)` */ readonly record: binaryen.ExpressionRef /* (ref $Record) */} {
		const {mod: {wasm}, reftype} = this.vm;
		return {get record() { return wasm.struct.get(FIELD.RECORD, ref, reftype.Record); }};
	}

	/** Return whether the given record has a property amongst its entries with the given key. */
	public hasKey(record: binaryen.ExpressionRef /* (ref $Cpl-Record) */, key: binaryen.ExpressionRef /* i64 */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Cpl-Record.has-key', [record, key], binaryen.Type.i32);
	}

	/** Get the value in a record at the given key. */
	public get(record: binaryen.ExpressionRef /* (ref $Cpl-Record) */, key: binaryen.ExpressionRef /* i64 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Cpl-Record.get', [record, key], this.vm.reftype.Value);
	}
}
