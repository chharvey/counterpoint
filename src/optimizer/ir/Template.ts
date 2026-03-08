import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** Create a string template. */
export class Template extends Value {
	public constructor(private readonly items: readonly Value[]) {
		super(OpCode.STR_TEMPLATE, TYPE.STR);
	}

	public override toString(): string {
		return super.toString(...this.items);
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Array.forEachAggregated(this.items, (item) => item.validate());
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
