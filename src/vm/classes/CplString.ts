import type * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Struct field constant indices. */
const FIELD = {/** `$Cpl-String.$internal` */ INTERNAL: 0} as const;



export class CplString implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
		]);
	}


	public field(ref: binaryen.ExpressionRef /* (ref null $Cpl-String) */): {/** @return `(struct.get $Cpl-String $internal <ref>)` */ readonly internal: binaryen.ExpressionRef /* (ref $StringInternal) */} {
		const {mod: {wasm}, reftype} = this.vm;
		return {get internal() { return wasm.struct.get(FIELD.INTERNAL, ref, reftype.StringInternal); }};
	}
}
