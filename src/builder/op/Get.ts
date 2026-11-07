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
	CLASS_CLASS,
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
			this.#interpretedValue ??= this.target.source === CoreLibName.CLASS
				? CLASS_CLASS
				: new VALUE.Class(this.target.classSignature.supertype, CLASS_CLASS);
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
			const {vm: {mod: {wasm}, reftype, Value: VmValue}} = cg;
			const class_class: binaryen.ExpressionRef /* (ref $Class) */ = wasm.global.get('Class.CLASS', reftype.Class);
			switch (this.target.source) {
				case CoreLibName.CLASS:  { return VmValue.newComposite(class_class); }
				case CoreLibName.OBJECT: { return VmValue.newComposite(wasm.global.get('Class.OBJECT', reftype.Class)); }
				case CoreLibName.LIST:   { return VmValue.newComposite(wasm.global.get('Class.LIST',   reftype.Class)); }
				case CoreLibName.DICT:   { return VmValue.newComposite(wasm.global.get('Class.DICT',   reftype.Class)); }
				case CoreLibName.MAP:    { return VmValue.newComposite(wasm.global.get('Class.MAP',    reftype.Class)); }
				default:                 { return VmValue.newComposite(cg.codegenClass(class_class)); }
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
