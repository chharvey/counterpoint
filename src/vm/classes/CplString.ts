import type * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Struct field constant indices. */
const FIELD = {/** `$Cpl-String.$string` */ STRING: 0} as const;



export class CplString implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
		]);
	}


	public field(ref: binaryen.ExpressionRef /* (ref null $Cpl-String) */): {/** @return `(struct.get $Cpl-String $string <ref>)` */ readonly string: binaryen.ExpressionRef /* (ref $String) */} {
		const {mod: {wasm}, reftype} = this.vm;
		return {get string() { return wasm.struct.get(FIELD.STRING, ref, reftype.String); }};
	}
}
