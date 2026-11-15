import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {
	CoreLibName,
	CORE_LIB_NAMES,
} from '../../parser/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {
	SymbolSchemaVar,
	SymbolSchemaClass,
} from '../../validator/index.ts';
import type {
	Temp,
	BuilderLocalSymbol,
} from '../Builder.ts';
import {OpCode} from './Opcode.ts';
import {ValueTac} from './ValueTac.ts';



/** Read the value of a variable/local. */
export class Get extends ValueTac {
	public readonly targetName: string;


	public constructor(target: SymbolSchemaVar | SymbolSchemaClass, typ: TYPE.Type);
	public constructor(target: Temp);
	public constructor(public readonly target: BuilderLocalSymbol, typ?: TYPE.Type) {
		super(OpCode.GET, target instanceof SymbolSchemaVar || target instanceof SymbolSchemaClass ? typ! : target.type);
		this.targetName = this.target instanceof SymbolSchemaVar || this.target instanceof SymbolSchemaClass ? this.target.source : this.target.name;
	}


	public override toString(): string {
		return super.toString(this.targetName);
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
		return cg.getLocal(this.target)?.get() ?? assert.fail(new ReferenceError(`Local variable \`${this.targetName}\` must be set first!`));
	}

	public override asTac(): this {
		return this;
	}
}
