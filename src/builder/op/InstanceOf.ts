import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** An enum of allowed class names. */
export enum InstanceOfName {
	SYMBOL,
	INTEGER,
	NATURAL,
	FLOAT,
	STRING,
	OBJECT,
	LIST,
	DICT,
	SET,
	MAP,
	MAYBE,
	NONE,
	SOME,
}



/** Tests whether an operand is an instance of a class. */
export class InstanceOf extends Value {
	public constructor(
		private readonly name:     InstanceOfName,
		private readonly operand:  ValueTac,
	) {
		super(OpCode.INSTANCEOF, TYPE.BOOL);
	}

	public override toString(): string {
		return super.toString(InstanceOfName[this.name], this.operand);
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		this.operand.validate(builder);
	}

	public override interpret(interp: Interpreter): VALUE.Value {
		const operand: VALUE.Value = this.operand.interpret(interp);
		switch (this.name) {
			case InstanceOfName.SYMBOL:  { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Symbol); }
			case InstanceOfName.INTEGER: { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Integer); }
			case InstanceOfName.NATURAL: { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Natural); }
			case InstanceOfName.FLOAT:   { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Float); }
			case InstanceOfName.STRING:  { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.String); }
			case InstanceOfName.OBJECT:  { return VALUE.Boolean.fromBoolean(operand.isReference); }
			case InstanceOfName.LIST:    { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.List); }
			case InstanceOfName.DICT:    { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Dict); }
			case InstanceOfName.SET:     { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Set); }
			case InstanceOfName.MAP:     { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Map); }
			case InstanceOfName.MAYBE:   { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Maybe); }
			case InstanceOfName.NONE:    { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Maybe && operand.isNone); }
			case InstanceOfName.SOME:    { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Maybe && !operand.isNone); }
		}
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const code: binaryen.ExpressionRef = this.operand.codegen(cg);
		switch (this.name) {
			case InstanceOfName.SYMBOL:  { return cg.vm.op.isInt(code); }
			case InstanceOfName.INTEGER: { return cg.vm.op.isInt(code); }
			case InstanceOfName.NATURAL: { return cg.vm.op.isNat(code); }
			case InstanceOfName.FLOAT:   { return cg.vm.op.isFloat(code); }
			case InstanceOfName.STRING:  { return cg.vm.op.isString(code); }
			case InstanceOfName.OBJECT:  { return cg.vm.op.isObject(code); }
			case InstanceOfName.LIST:    { return cg.vm.op.isList(code); }
			case InstanceOfName.DICT:    { return cg.vm.op.isDict(code); }
			case InstanceOfName.SET:     { return cg.vm.op.isMap(code); }
			case InstanceOfName.MAP:     { return cg.vm.op.isMap(code); }
			case InstanceOfName.MAYBE:   { return cg.vm.op.isMaybe(code); }
			case InstanceOfName.NONE:    { return cg.vm.op.isNone(code); }
			case InstanceOfName.SOME:    { return cg.vm.op.isSome(code); }
		}
	}
}
