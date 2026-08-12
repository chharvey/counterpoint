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
	BOOLEAN,
	SYMBOL,
	INTEGER,
	NATURAL,
	FLOAT,
	STRING,
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
			case InstanceOfName.BOOLEAN: { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Boolean); }
			case InstanceOfName.SYMBOL:  { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Symbol); }
			case InstanceOfName.INTEGER: { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Integer); }
			case InstanceOfName.NATURAL: { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Natural); }
			case InstanceOfName.FLOAT:   { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Float); }
			case InstanceOfName.STRING:  { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.String); }

			case InstanceOfName.LIST: { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.List); }
			case InstanceOfName.DICT: { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Dict); }
			case InstanceOfName.SET:  { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Set); }
			case InstanceOfName.MAP:  { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Map); }

			case InstanceOfName.MAYBE: { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Maybe); }
			case InstanceOfName.NONE:  { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Maybe && operand.isNone); }
			case InstanceOfName.SOME:  { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Maybe && !operand.isNone); }
		}
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {vm: {reftype, op, Vect}, mod: {wasm}} = cg;
		const code: binaryen.ExpressionRef = this.operand.codegen(cg);
		switch (this.name) {
			case InstanceOfName.BOOLEAN: {
				return this.#instanceOfPrimitive(cg, code, (vect) => wasm.i32.or(
					Vect.isConst(vect, false),
					Vect.isConst(vect, true),
				));
			}

			case InstanceOfName.INTEGER: { return this.#instanceOfPrimitive(cg, code, Vect.isInt.bind(Vect)); }
			case InstanceOfName.NATURAL: { return this.#instanceOfPrimitive(cg, code, Vect.isNat.bind(Vect)); }
			case InstanceOfName.FLOAT:   { return this.#instanceOfPrimitive(cg, code, Vect.isFloat.bind(Vect)); }

			case InstanceOfName.STRING: { return this.#instanceOfComposite(cg, code, reftype.String); }
			case InstanceOfName.LIST:   { return this.#instanceOfComposite(cg, code, reftype.List); }
			case InstanceOfName.DICT:   { return this.#instanceOfComposite(cg, code, reftype.Dict); }
			case InstanceOfName.MAP:    { return this.#instanceOfComposite(cg, code, reftype.Map); }
			case InstanceOfName.MAYBE:  { return this.#instanceOfComposite(cg, code, reftype.Maybe); }

			case InstanceOfName.NONE:  { return op.isNone(code); }
			case InstanceOfName.SOME:  { return op.isSome(code); }
		}
		throw new Error(`instance-of '${ InstanceOfName[this.name] }' not yet supported.`);
	}

	#instanceOfPrimitive(
		cg:       CodeGenerator,
		operand:  binaryen.ExpressionRef /* (ref $Value) */,
		callable: (vect: binaryen.ExpressionRef /* v128 */) => binaryen.ExpressionRef /* i32 */,
	): binaryen.ExpressionRef /* (ref $Value) */ {
		const {vm: {Value: VmValue}, mod: {wasm}} = cg;
		return VmValue.boolFromI32(wasm.i32.and(
			VmValue.isPrimitive(operand),
			callable(VmValue.field(operand).primitive),
		));
	}

	#instanceOfComposite(
		cg:      CodeGenerator,
		operand: binaryen.ExpressionRef /* (ref $Value) */,
		reftype: binaryen.Type,
	): binaryen.ExpressionRef /* (ref $Value) */ {
		const {vm: {Value: VmValue}, mod: {wasm}} = cg;
		return VmValue.boolFromI32(wasm.i32.and(
			VmValue.isComposite(operand),
			wasm.ref.test(VmValue.field(operand).composite, reftype),
		));
	}
}
