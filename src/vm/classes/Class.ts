import type * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** WASM representation of a Counterpoint class. */
class VmClass implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
		]);
	}

	/** The Counterpoint `Class`  value. */ public get CLASS():  binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.CLASS',  this.vm.reftype.Class); }
	/** The Counterpoint `Object` value. */ public get OBJECT(): binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.OBJECT', this.vm.reftype.Class); }
	/** The Counterpoint `List`   value. */ public get LIST():   binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.LIST',   this.vm.reftype.Class); }
	/** The Counterpoint `Dict`   value. */ public get DICT():   binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.DICT',   this.vm.reftype.Class); }
	/** The Counterpoint `Map`    value. */ public get MAP():    binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.MAP',    this.vm.reftype.Class); }
}
export {VmClass as Class};
