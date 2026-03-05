import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Evaluate an expression but then drop it. */
export class Drop extends Instruction {
	public constructor(private readonly value: Value) {
		super();
	}

	public override toString(): string {
		return `(DROP ${ this.value })`;
	}

	@runOnceMethod
	public override validate(): void {
		return this.value.validate();
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
