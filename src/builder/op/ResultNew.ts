import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	assert_instanceof,
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



/** Create a Result. */
export class ResultNew extends Value {
	public constructor(
		private readonly isOk: boolean,
		success_type: TYPE.Type,
		failure_type: TYPE.Type,
		public readonly argument: ValueTac,
	) {
		super(OpCode.RESULT_NEW, new TYPE.Result(success_type, failure_type));
	}


	public override toString(): string {
		return super.toString(...(this.isOk ? [this.argument.toString(), 'nil'] : ['nil', this.argument.toString()]));
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		assert_instanceof(this.type, TYPE.Result);
		if (!this.isOk) {
			assert.ok(this.argument.type.isSubtypeOf(TYPE.EXCP));
		}
		return this.argument.validate(builder);
	}

	public override interpret(interp: Interpreter): VALUE.Result {
		return new VALUE.Result(this.isOk, this.argument.interpret(interp));
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {vm: {reftype, Value: VmValue}} = cg;
		let argument: binaryen.ExpressionRef /* (ref $Value) */ = this.argument.codegen(cg);
		if (!this.isOk) {
			argument /* (ref $Exception) */ = VmValue.cast(argument, reftype.Exception);
		}
		return VmValue.newComposite(cg.codegenResult(this.isOk, argument));
	}
}
