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
import {IntrinsicName} from '../../parser/index.ts';
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
	| IntrinsicName.SYMBOL
	| IntrinsicName.INTEGER
	| IntrinsicName.NATURAL
	| IntrinsicName.FLOAT
	| IntrinsicName.STRING
	| IntrinsicName.OBJECT
	| IntrinsicName.LIST
	| IntrinsicName.DICT
	| IntrinsicName.SET
	| IntrinsicName.MAP
	| IntrinsicName.MAYBE
	| IntrinsicName.NONE
	| IntrinsicName.SOME
	| IntrinsicName.FUNCTION
);



/** Tests whether an operand is an instance of a class. */
export class Instance extends Value {
	public constructor(operator: OpCode.INSTANCEOF, name: InstanceOfName, operand: ValueTac);
	public constructor(operator: OpCode.CAST, name: IntrinsicName, operand: ValueTac);
	public constructor(
		private readonly operator: OpCodeInstance,
		private readonly name:     InstanceOfName | IntrinsicName,
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
			case IntrinsicName.NULL:     { is_instance = operand instanceof VALUE.Null;                     break; }
			case IntrinsicName.BOOLEAN:  { is_instance = operand instanceof VALUE.Boolean;                  break; }
			case IntrinsicName.SYMBOL:   { is_instance = operand instanceof VALUE.Symbol;                   break; }
			case IntrinsicName.INTEGER:  { is_instance = operand instanceof VALUE.Integer;                  break; }
			case IntrinsicName.NATURAL:  { is_instance = operand instanceof VALUE.Natural;                  break; }
			case IntrinsicName.FLOAT:    { is_instance = operand instanceof VALUE.Float;                    break; }
			case IntrinsicName.STRING:   { is_instance = operand instanceof VALUE.String;                   break; }
			case IntrinsicName.OBJECT:   { is_instance = operand.isReference;                               break; }
			case IntrinsicName.LIST:     { is_instance = operand instanceof VALUE.List;                     break; }
			case IntrinsicName.DICT:     { is_instance = operand instanceof VALUE.Dict;                     break; }
			case IntrinsicName.SET:      { is_instance = operand instanceof VALUE.Set;                      break; }
			case IntrinsicName.MAP:      { is_instance = operand instanceof VALUE.Map;                      break; }
			case IntrinsicName.MAYBE:    { is_instance = operand instanceof VALUE.Maybe;                    break; }
			case IntrinsicName.NONE:     { is_instance = operand instanceof VALUE.Maybe && operand.isNone;  break; }
			case IntrinsicName.SOME:     { is_instance = operand instanceof VALUE.Maybe && !operand.isNone; break; }
			case IntrinsicName.FUNCTION: { is_instance = operand instanceof VALUE.Function;                 break; }
		}
		switch (this.operator) {
			case OpCode.INSTANCEOF: {
				return VALUE.Boolean.fromBoolean(is_instance);
			}
			case OpCode.CAST: {
				if (is_instance) {
					return operand;
				} else {
					throw new Error(`Invalid cast to ${ this.name }.`);
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
					case IntrinsicName.SYMBOL:   { return cg.vm.op.isInt(code); }
					case IntrinsicName.INTEGER:  { return cg.vm.op.isInt(code); }
					case IntrinsicName.NATURAL:  { return cg.vm.op.isNat(code); }
					case IntrinsicName.FLOAT:    { return cg.vm.op.isFloat(code); }
					case IntrinsicName.STRING:   { return cg.vm.op.isString(code); }
					case IntrinsicName.OBJECT:   { return cg.vm.op.isObject(code); }
					case IntrinsicName.LIST:     { return cg.vm.op.isList(code); }
					case IntrinsicName.DICT:     { return cg.vm.op.isDict(code); }
					case IntrinsicName.SET:      { return cg.vm.op.isMap(code); }
					case IntrinsicName.MAP:      { return cg.vm.op.isMap(code); }
					case IntrinsicName.MAYBE:    { return cg.vm.op.isMaybe(code); }
					case IntrinsicName.NONE:     { return cg.vm.op.isNone(code); }
					case IntrinsicName.SOME:     { return cg.vm.op.isSome(code); }
					case IntrinsicName.FUNCTION: { return cg.vm.op.isFunction(code); }
				}
				break;
			}
			case OpCode.CAST: {
				switch (this.name) {
					case IntrinsicName.NULL:     { return cg.vm.op.asNull(code); }
					case IntrinsicName.BOOLEAN:  { return cg.vm.op.asBool(code); }
					case IntrinsicName.SYMBOL:   { return cg.vm.op.asInt(code); }
					case IntrinsicName.INTEGER:  { return cg.vm.op.asInt(code); }
					case IntrinsicName.NATURAL:  { return cg.vm.op.asNat(code); }
					case IntrinsicName.FLOAT:    { return cg.vm.op.asFloat(code); }
					case IntrinsicName.STRING:   { return cg.vm.op.asString(code); }
					case IntrinsicName.OBJECT:   { return cg.vm.op.asObject(code); }
					case IntrinsicName.LIST:     { return cg.vm.op.asList(code); }
					case IntrinsicName.DICT:     { return cg.vm.op.asDict(code); }
					case IntrinsicName.SET:      { return cg.vm.op.asMap(code); }
					case IntrinsicName.MAP:      { return cg.vm.op.asMap(code); }
					case IntrinsicName.MAYBE:    { return cg.vm.op.asMaybe(code); }
					case IntrinsicName.NONE:     { return cg.vm.op.asNone(code); }
					case IntrinsicName.SOME:     { return cg.vm.op.asSome(code); }
					case IntrinsicName.FUNCTION: { return cg.vm.op.asFunction(code); }
				}
			}
		}
	}
}
