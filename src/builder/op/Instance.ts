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
import {AST} from '../../validator/index.ts';
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
	| AST.IntrinsicName.SYMBOL
	| AST.IntrinsicName.INTEGER
	| AST.IntrinsicName.NATURAL
	| AST.IntrinsicName.FLOAT
	| AST.IntrinsicName.STRING
	| AST.IntrinsicName.OBJECT
	| AST.IntrinsicName.LIST
	| AST.IntrinsicName.DICT
	| AST.IntrinsicName.SET
	| AST.IntrinsicName.MAP
	| AST.IntrinsicName.MAYBE
	| AST.IntrinsicName.NONE
	| AST.IntrinsicName.SOME
);



/** Tests whether an operand is an instance of a class. */
export class Instance extends Value {
	public constructor(operator: OpCode.INSTANCEOF, name: InstanceOfName, operand: ValueTac);
	public constructor(operator: OpCode.CAST, name: AST.IntrinsicName, operand: ValueTac);
	public constructor(
		private readonly operator: OpCodeInstance,
		private readonly name:     InstanceOfName | AST.IntrinsicName,
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
			case AST.IntrinsicName.NULL:    { is_instance = operand instanceof VALUE.Null;                     break; }
			case AST.IntrinsicName.BOOLEAN: { is_instance = operand instanceof VALUE.Boolean;                  break; }
			case AST.IntrinsicName.SYMBOL:  { is_instance = operand instanceof VALUE.Symbol;                   break; }
			case AST.IntrinsicName.INTEGER: { is_instance = operand instanceof VALUE.Integer;                  break; }
			case AST.IntrinsicName.NATURAL: { is_instance = operand instanceof VALUE.Natural;                  break; }
			case AST.IntrinsicName.FLOAT:   { is_instance = operand instanceof VALUE.Float;                    break; }
			case AST.IntrinsicName.STRING:  { is_instance = operand instanceof VALUE.String;                   break; }
			case AST.IntrinsicName.OBJECT:  { is_instance = operand.isReference;                               break; }
			case AST.IntrinsicName.LIST:    { is_instance = operand instanceof VALUE.List;                     break; }
			case AST.IntrinsicName.DICT:    { is_instance = operand instanceof VALUE.Dict;                     break; }
			case AST.IntrinsicName.SET:     { is_instance = operand instanceof VALUE.Set;                      break; }
			case AST.IntrinsicName.MAP:     { is_instance = operand instanceof VALUE.Map;                      break; }
			case AST.IntrinsicName.MAYBE:   { is_instance = operand instanceof VALUE.Maybe;                    break; }
			case AST.IntrinsicName.NONE:    { is_instance = operand instanceof VALUE.Maybe && operand.isNone;  break; }
			case AST.IntrinsicName.SOME:    { is_instance = operand instanceof VALUE.Maybe && !operand.isNone; break; }
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
					case AST.IntrinsicName.SYMBOL:  { return cg.vm.op.isInt(code); }
					case AST.IntrinsicName.INTEGER: { return cg.vm.op.isInt(code); }
					case AST.IntrinsicName.NATURAL: { return cg.vm.op.isNat(code); }
					case AST.IntrinsicName.FLOAT:   { return cg.vm.op.isFloat(code); }
					case AST.IntrinsicName.STRING:  { return cg.vm.op.isString(code); }
					case AST.IntrinsicName.OBJECT:  { return cg.vm.op.isObject(code); }
					case AST.IntrinsicName.LIST:    { return cg.vm.op.isList(code); }
					case AST.IntrinsicName.DICT:    { return cg.vm.op.isDict(code); }
					case AST.IntrinsicName.SET:     { return cg.vm.op.isMap(code); }
					case AST.IntrinsicName.MAP:     { return cg.vm.op.isMap(code); }
					case AST.IntrinsicName.MAYBE:   { return cg.vm.op.isMaybe(code); }
					case AST.IntrinsicName.NONE:    { return cg.vm.op.isNone(code); }
					case AST.IntrinsicName.SOME:    { return cg.vm.op.isSome(code); }
				}
				break;
			}
			case OpCode.CAST: {
				throw new Error('`Instance[operator=CAST]#codegen` not yet supported.');
			}
		}
	}
}
