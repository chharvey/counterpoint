import type * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import type {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Call a function or constructor. */
export class Call extends Value {
	public constructor(
		private readonly callable: ValueTac,
		private readonly args:     readonly ValueTac[],
		return_type: TYPE.Type,
	) {
		super(OpCode.CALL, return_type);
	}

	public override toString(): string {
		return super.toString(this.callable, ...this.args);
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		return xjs.Array.forEachAggregated([this.callable, ...this.args], (value) => value.validate(builder));
	}

	public override interpret(_interp: Interpreter): VALUE.Value {
		throw new Error('`OP.Call#interpret` is not yet supported.');
	}

	@memoizeMethod
	public override codegen(_: CodeGenerator): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
