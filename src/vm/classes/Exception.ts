import type * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$Exception.$message` */ MESSAGE: 1,
	/** `$Exception.$cause` */   CAUSE:   2,
} as const;



/** Precursor to the Counterpoint `Exception` class. */
export class Exception implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
		]);
	}


	public field(ref: binaryen.ExpressionRef /* (ref null $Exception) */): {
		/** @return `(struct.get $Exception $message <ref>)` */ readonly message: binaryen.ExpressionRef /* (ref $String) */,
		/** @return `(struct.get $Exception $cause   <ref>)` */ readonly cause:   binaryen.ExpressionRef /* (ref null $Exception) */,
	} {
		const {mod: {wasm}, reftype, reftypeNull} = this.vm;
		return {
			get message() { return wasm.struct.get(FIELD.MESSAGE, ref, reftype.String); },
			get cause()   { return wasm.struct.get(FIELD.CAUSE,   ref, reftypeNull.Exception); },
		};
	}
}
