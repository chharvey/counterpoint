import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	CoreLibName,
	CORE_LIB_NAMES,
} from '../../parser/index.ts';
import {
	VALUE,
	type TYPE,
} from '../../typer/index.ts';
import {
	SymbolSchemaVar,
	SymbolSchemaClass,
} from '../../validator/index.ts';
import type {
	Temp,
	BuilderLocalSymbol,
	Builder,
} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {ValueTac} from './ValueTac.ts';



/** Read the value of a variable/local. */
export class Get extends ValueTac {
	#interpretedValue?: VALUE.Value;


	public constructor(target: SymbolSchemaVar | SymbolSchemaClass, typ: TYPE.Type);
	public constructor(target: Temp);
	public constructor(private readonly target: BuilderLocalSymbol, typ?: TYPE.Type) {
		super(OpCode.GET, target instanceof SymbolSchemaVar || target instanceof SymbolSchemaClass ? typ! : target.type);
	}


	public override toString(): string {
		return super.toString(this.target instanceof SymbolSchemaVar || this.target instanceof SymbolSchemaClass ? this.target.source : this.target.name);
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		if (builder.getLocalStatus(this.target) !== 'set') {
			throw new ReferenceError(`Local variable \`${this.#targetName}\` must be set before getting!`);
		}
	}

	public override interpret(interp: Interpreter): VALUE.Value {
		if (
			this.target instanceof SymbolSchemaClass &&
			CORE_LIB_NAMES.includes(this.target.source as CoreLibName)
		) {
			let native_class: VALUE.Class['nativeClass'];
			switch (this.target.source as CoreLibName) {
				case CoreLibName.NULL:      { native_class = VALUE.Null;      break; }
				case CoreLibName.BOOLEAN:   { native_class = VALUE.Boolean;   break; }
				case CoreLibName.SYMBOL:    { native_class = VALUE.Symbol;    break; }
				case CoreLibName.INTEGER:   { native_class = VALUE.Integer;   break; }
				case CoreLibName.NATURAL:   { native_class = VALUE.Natural;   break; }
				case CoreLibName.FLOAT:     { native_class = VALUE.Float;     break; }
				case CoreLibName.STRING:    { native_class = VALUE.String;    break; }
				case CoreLibName.OBJECT:    { native_class = VALUE.Object;    break; }
				case CoreLibName.LIST:      { native_class = VALUE.List;      break; }
				case CoreLibName.DICT:      { native_class = VALUE.Dict;      break; }
				case CoreLibName.SET:       { native_class = VALUE.Set;       break; }
				case CoreLibName.MAP:       { native_class = VALUE.Map;       break; }
				case CoreLibName.EXCEPTION: { native_class = VALUE.Exception; break; }
				case CoreLibName.MAYBE:     { native_class = VALUE.Maybe;     break; }
				case CoreLibName.NONE:      { throw new Error('`None` class not yet supported.'); }
				case CoreLibName.SOME:      { throw new Error('`Some` class not yet supported.'); }
				case CoreLibName.RESULT:    { native_class = VALUE.Result;    break; }
				case CoreLibName.FAIL:      { throw new Error('`Fail` class not yet supported.'); }
				case CoreLibName.OK:        { throw new Error('`Ok`   class not yet supported.'); }
				case CoreLibName.FUNCTION:  { native_class = VALUE.Function;  break; }
				case CoreLibName.CLASS:     { native_class = VALUE.Class;     break; }
			}
			this.#interpretedValue ??= new VALUE.Class(this.target.classSignature.instanceType, native_class);
			return this.#interpretedValue;
		}
		return interp.getLocalValue(this.target) ?? assert.fail(new ReferenceError(`Local variable \`${this.#targetName}\` must be set first!`));
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		if (
			this.target instanceof SymbolSchemaClass &&
			CORE_LIB_NAMES.includes(this.target.source as CoreLibName)
		) {
			const {vm: {Class: VmClass}} = cg;
			switch (this.target.source) {
				case CoreLibName.CLASS:     { return VmClass.CLASS; }
				case CoreLibName.NULL:      { return VmClass.NULL; }
				case CoreLibName.BOOLEAN:   { return VmClass.BOOLEAN; }
				case CoreLibName.SYMBOL:    { return VmClass.SYMBOL; }
				case CoreLibName.INTEGER:   { return VmClass.INTEGER; }
				case CoreLibName.NATURAL:   { return VmClass.NATURAL; }
				case CoreLibName.FLOAT:     { return VmClass.FLOAT; }
				case CoreLibName.STRING:    { return VmClass.STRING; }
				case CoreLibName.OBJECT:    { return VmClass.OBJECT; }
				case CoreLibName.LIST:      { return VmClass.LIST; }
				case CoreLibName.DICT:      { return VmClass.DICT; }
				case CoreLibName.SET:       { return VmClass.SET; }
				case CoreLibName.MAP:       { return VmClass.MAP; }
				case CoreLibName.EXCEPTION: { return VmClass.EXCEPTION; }
				case CoreLibName.MAYBE:     { return VmClass.MAYBE; }
				case CoreLibName.NONE:      { return VmClass.NONE; }
				case CoreLibName.SOME:      { return VmClass.SOME; }
				case CoreLibName.RESULT:    { return VmClass.RESULT; }
				case CoreLibName.FAIL:      { return VmClass.FAIL; }
				case CoreLibName.OK:        { return VmClass.OK; }
				case CoreLibName.FUNCTION:  { return VmClass.FUNCTION; }
				default:                    { return cg.codegenClass(VmClass.CLASS); } // return a new class who is an instance of `Class`
			}
		}
		return cg.getLocal(this.target)?.get() ?? assert.fail(new ReferenceError(`Local variable \`${this.#targetName}\` must be set first!`));
	}

	public override asTac(): this {
		return this;
	}

	get #targetName(): string {
		return this.target instanceof SymbolSchemaVar || this.target instanceof SymbolSchemaClass ? this.target.source : this.target.name;
	}
}
