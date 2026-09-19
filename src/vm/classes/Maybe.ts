/* eslint-disable @stylistic/object-curly-newline */
import type * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$Maybe.$value` */ VALUE: 1,
} as const;



/** An entry in a record/Dict. */
export class Maybe implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
		]);
	}


	public field(ref: binaryen.ExpressionRef /* (ref null $Maybe) */): {
		/** @return `(struct.get $Maybe $value <ref>)` */ readonly value: binaryen.ExpressionRef /* (ref null $Value) */,
	} {
		const {mod: {wasm}, reftypeNull} = this.vm;
		return {
			get value() { return wasm.struct.get(FIELD.VALUE, ref, reftypeNull.Value); },
		};
	}
}
