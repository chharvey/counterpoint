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
import {CoreLibName} from '../../parser/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** An enum of allowed operations. */
export type OpCodeInstance = (
	| OpCode.INSTANCEOF
	| OpCode.CAST
);



/** An enum of allowed class names. */
type InstanceOfName = (
	| CoreLibName.SYMBOL
	| CoreLibName.INTEGER
	| CoreLibName.NATURAL
	| CoreLibName.FLOAT
	| CoreLibName.STRING
	| CoreLibName.OBJECT
	| CoreLibName.LIST
	| CoreLibName.DICT
	| CoreLibName.SET
	| CoreLibName.MAP
	| CoreLibName.EXCEPTION
	| CoreLibName.MAYBE
	| CoreLibName.NONE
	| CoreLibName.SOME
	| CoreLibName.RESULT
	| CoreLibName.FAIL
	| CoreLibName.OK
	| CoreLibName.FUNCTION
	| CoreLibName.CLASS
);



/** Tests whether an operand is an instance of a class. */
export class Instance extends Value {
	public constructor(operator: OpCode.INSTANCEOF, name: InstanceOfName, operand: ValueTac);
	public constructor(operator: OpCode.CAST, name: CoreLibName, operand: ValueTac);
	public constructor(
		private readonly operator: OpCodeInstance,
		private readonly name:     InstanceOfName | CoreLibName,
		private readonly operand:  ValueTac,
	) {
		super(operator, TYPE.BOOL);
	}

	public override toString(): string {
		return super.toString(this.name, this.operand);
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		this.operand.validate(builder);
	}

	public override interpret(interp: Interpreter): VALUE.Value {
		const operand: VALUE.Value = this.operand.interpret(interp);
		let is_instance: boolean;
		switch (this.name) {
			case CoreLibName.NULL:      { is_instance = operand instanceof VALUE.Null;                     break; }
			case CoreLibName.BOOLEAN:   { is_instance = operand instanceof VALUE.Boolean;                  break; }
			case CoreLibName.SYMBOL:    { is_instance = operand instanceof VALUE.Symbol;                   break; }
			case CoreLibName.INTEGER:   { is_instance = operand instanceof VALUE.Integer;                  break; }
			case CoreLibName.NATURAL:   { is_instance = operand instanceof VALUE.Natural;                  break; }
			case CoreLibName.FLOAT:     { is_instance = operand instanceof VALUE.Float;                    break; }
			case CoreLibName.STRING:    { is_instance = operand instanceof VALUE.String;                   break; }
			case CoreLibName.OBJECT:    { is_instance = operand.isReference;                               break; }
			case CoreLibName.LIST:      { is_instance = operand instanceof VALUE.List;                     break; }
			case CoreLibName.DICT:      { is_instance = operand instanceof VALUE.Dict;                     break; }
			case CoreLibName.SET:       { is_instance = operand instanceof VALUE.Set;                      break; }
			case CoreLibName.MAP:       { is_instance = operand instanceof VALUE.Map;                      break; }
			case CoreLibName.EXCEPTION: { is_instance = operand instanceof VALUE.Exception;                break; }
			case CoreLibName.MAYBE:     { is_instance = operand instanceof VALUE.Maybe;                    break; }
			case CoreLibName.NONE:      { is_instance = operand instanceof VALUE.Maybe && operand.isNone;  break; }
			case CoreLibName.SOME:      { is_instance = operand instanceof VALUE.Maybe && !operand.isNone; break; }
			case CoreLibName.RESULT:    { is_instance = operand instanceof VALUE.Result;                   break; }
			case CoreLibName.FAIL:      { is_instance = operand instanceof VALUE.Result && !operand.isOk;  break; }
			case CoreLibName.OK:        { is_instance = operand instanceof VALUE.Result && operand.isOk;   break; }
			case CoreLibName.FUNCTION:  { is_instance = operand instanceof VALUE.Function;                 break; }
			case CoreLibName.CLASS:     { is_instance = operand instanceof VALUE.Class;                    break; }
		}
		switch (this.operator) {
			case OpCode.INSTANCEOF: {
				return VALUE.Boolean.fromBoolean(is_instance);
			}
			case OpCode.CAST: {
				if (is_instance) {
					return operand;
				} else {
					throw new Error(`Invalid cast to ${this.name}.`);
				}
			}
		}
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const code: binaryen.ExpressionRef = this.operand.codegen(cg);
		switch (this.operator) {
			case OpCode.INSTANCEOF: {
				switch (this.name as InstanceOfName) {
					case CoreLibName.SYMBOL:    { return cg.vm.op.isInt(code); }
					case CoreLibName.INTEGER:   { return cg.vm.op.isInt(code); }
					case CoreLibName.NATURAL:   { return cg.vm.op.isNat(code); }
					case CoreLibName.FLOAT:     { return cg.vm.op.isFloat(code); }
					case CoreLibName.STRING:    { return cg.vm.op.isString(code); }
					case CoreLibName.OBJECT:    { return cg.vm.op.isObject(code); }
					case CoreLibName.LIST:      { return cg.vm.op.isList(code); }
					case CoreLibName.DICT:      { return cg.vm.op.isDict(code); }
					case CoreLibName.SET:       { return cg.vm.op.isMap(code); }
					case CoreLibName.MAP:       { return cg.vm.op.isMap(code); }
					case CoreLibName.EXCEPTION: { return cg.vm.op.isException(code); }
					case CoreLibName.MAYBE:     { return cg.vm.op.isMaybe(code); }
					case CoreLibName.NONE:      { return cg.vm.op.isNone(code); }
					case CoreLibName.SOME:      { return cg.vm.op.isSome(code); }
					case CoreLibName.RESULT:    { return cg.vm.op.isResult(code); }
					case CoreLibName.FAIL:      { return cg.vm.op.isFail(code); }
					case CoreLibName.OK:        { return cg.vm.op.isOk(code); }
					case CoreLibName.FUNCTION:  { return cg.vm.op.isFunction(code); }
					case CoreLibName.CLASS:     { throw new Error('not yet supported.'); }
				}
				break;
			}
			case OpCode.CAST: {
				switch (this.name) {
					case CoreLibName.NULL:      { return cg.vm.op.asNull(code); }
					case CoreLibName.BOOLEAN:   { return cg.vm.op.asBool(code); }
					case CoreLibName.SYMBOL:    { return cg.vm.op.asInt(code); }
					case CoreLibName.INTEGER:   { return cg.vm.op.asInt(code); }
					case CoreLibName.NATURAL:   { return cg.vm.op.asNat(code); }
					case CoreLibName.FLOAT:     { return cg.vm.op.asFloat(code); }
					case CoreLibName.STRING:    { return cg.vm.op.asString(code); }
					case CoreLibName.OBJECT:    { return cg.vm.op.asObject(code); }
					case CoreLibName.LIST:      { return cg.vm.op.asList(code); }
					case CoreLibName.DICT:      { return cg.vm.op.asDict(code); }
					case CoreLibName.SET:       { return cg.vm.op.asMap(code); }
					case CoreLibName.MAP:       { return cg.vm.op.asMap(code); }
					case CoreLibName.EXCEPTION: { return cg.vm.op.asException(code); }
					case CoreLibName.MAYBE:     { return cg.vm.op.asMaybe(code); }
					case CoreLibName.NONE:      { return cg.vm.op.asNone(code); }
					case CoreLibName.SOME:      { return cg.vm.op.asSome(code); }
					case CoreLibName.RESULT:    { return cg.vm.op.asResult(code); }
					case CoreLibName.FAIL:      { return cg.vm.op.asFail(code); }
					case CoreLibName.OK:        { return cg.vm.op.asOk(code); }
					case CoreLibName.FUNCTION:  { return cg.vm.op.asFunction(code); }
					case CoreLibName.CLASS:     { throw new Error('not yet supported.'); }
				}
				break;
			}
		}
	}
}
