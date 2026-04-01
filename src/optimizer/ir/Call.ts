import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** Call a function or constructor. */
export class Call extends Value {
	public constructor(
		private readonly callable: Value,
		private readonly args:     readonly Value[],
		return_type: TYPE.Type,
	) {
		super(OpCode.CALL, return_type);
	}

	public override toString(): string {
		return super.toString(this.callable, ...this.args);
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Array.forEachAggregated([this.callable, ...this.args], (value) => value.validate());
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
