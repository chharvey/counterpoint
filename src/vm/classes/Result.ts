import type * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$Result.$value`  */ VALUE:  1,
	/** `$Result.$reason` */ REASON: 2,
} as const;



/** An entry in a record/Dict. */
export class Result implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
		]);
	}


	public field(ref: binaryen.ExpressionRef /* (ref null $Result) */): {
		/** @return `(struct.get $Result $value  <ref>)` */ readonly value:  binaryen.ExpressionRef /* (ref null $Value) */,
		/** @return `(struct.get $Result $reason <ref>)` */ readonly reason: binaryen.ExpressionRef /* (ref null $Exception) */,
	} {
		const {mod: {wasm}, reftypeNull} = this.vm;
		return {
			get value()  { return wasm.struct.get(FIELD.VALUE,  ref, reftypeNull.Value); },
			get reason() { return wasm.struct.get(FIELD.REASON, ref, reftypeNull.Exception); },
		};
	}
}
