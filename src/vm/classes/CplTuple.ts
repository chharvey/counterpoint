import type * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Struct field constant indices. */
const FIELD = {/** `$Cpl-Tuple.$tuple` */ TUPLE: 0} as const;



export class CplTuple implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
		]);
	}


	public field(ref: binaryen.ExpressionRef /* (ref null $Cpl-Tuple) */): {/** @return `(struct.get $Cpl-Tuple $tuple <ref>)` */ readonly tuple: binaryen.ExpressionRef /* (ref $Tuple) */} {
		const {mod: {wasm}, reftype} = this.vm;
		return {get tuple() { return wasm.struct.get(FIELD.TUPLE, ref, reftype.Tuple); }};
	}
}
