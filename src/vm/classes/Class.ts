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

	/** The Counterpoint `Class`     class. */ public get CLASS():     binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.CLASS',     this.vm.reftype.Class); }
	/** The Counterpoint `Null`      class. */ public get NULL():      binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.NULL',      this.vm.reftype.Class); }
	/** The Counterpoint `Boolean`   class. */ public get BOOLEAN():   binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.BOOLEAN',   this.vm.reftype.Class); }
	/** The Counterpoint `Symbol`    class. */ public get SYMBOL():    binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.SYMBOL',    this.vm.reftype.Class); }
	/** The Counterpoint `Integer`   class. */ public get INTEGER():   binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.INTEGER',   this.vm.reftype.Class); }
	/** The Counterpoint `Natural`   class. */ public get NATURAL():   binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.NATURAL',   this.vm.reftype.Class); }
	/** The Counterpoint `Float`     class. */ public get FLOAT():     binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.FLOAT',     this.vm.reftype.Class); }
	/** The Counterpoint `String`    class. */ public get STRING():    binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.STRING',    this.vm.reftype.Class); }
	/** The Counterpoint `Object`    class. */ public get OBJECT():    binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.OBJECT',    this.vm.reftype.Class); }
	/** The Counterpoint `List`      class. */ public get LIST():      binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.LIST',      this.vm.reftype.Class); }
	/** The Counterpoint `Dict`      class. */ public get DICT():      binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.DICT',      this.vm.reftype.Class); }
	/** The Counterpoint `Set`       class. */ public get SET():       binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.SET',       this.vm.reftype.Class); }
	/** The Counterpoint `Map`       class. */ public get MAP():       binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.MAP',       this.vm.reftype.Class); }
	/** The Counterpoing `Exception` class. */ public get EXCEPTION(): binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.EXCEPTION', this.vm.reftype.Class); }
	/** The Counterpoing `Maybe`     class. */ public get MAYBE():     binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.MAYBE',     this.vm.reftype.Class); }
	/** The Counterpoing `None`      class. */ public get NONE():      binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.NONE',      this.vm.reftype.Class); }
	/** The Counterpoing `Some`      class. */ public get SOME():      binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.SOME',      this.vm.reftype.Class); }
	/** The Counterpoing `Result`    class. */ public get RESULT():    binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.RESULT',    this.vm.reftype.Class); }
	/** The Counterpoing `Fail`      class. */ public get FAIL():      binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.FAIL',      this.vm.reftype.Class); }
	/** The Counterpoing `Ok`        class. */ public get OK():        binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.OK',        this.vm.reftype.Class); }
	/** The Counterpoing `Function`  class. */ public get FUNCTION():  binaryen.ExpressionRef /* (ref $Class) */ { return this.vm.mod.wasm.global.get('Class.FUNCTION',  this.vm.reftype.Class); }

	/**
	 * The abstract superclass of all data (non-reference) classes.
	 * There is no “`Data`” class exposed at the language level.
	 */
	private get DATA(): binaryen.ExpressionRef /* (ref $Class) */ {
		return this.vm.mod.wasm.global.get('Class.DATA', this.vm.reftype.Class);
	}
}
export {VmClass as Class};
