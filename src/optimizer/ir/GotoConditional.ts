import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';
import type {Label} from './Label.ts';



/** Transfer control to the given label, conditionally if specified. */
export class GotoConditional extends Instruction {
	/**
	 * Construct a new Goto object.
	 * Represents a conditional jump based on a given boolean condition.
	 * Goto the first label if the condition is true, else to the second label.
	 * @param condition      the condition to evaluate
	 * @param label_if_true  the label to jump to if the condition is true
	 * @param label_if_false the label to jump to if the condition is false
	 */
	public constructor(
		private readonly condition:    Value,
		private readonly labelIfTrue:  Label,
		private readonly labelIfFalse: Label,
	) {
		super(OpCode.UNDEFINED);
	}

	public override toString(): string {
		return `goto_if ${ this.condition }: "${ this.labelIfTrue.name }"/"${ this.labelIfFalse.name }".`;
	}

	@runOnceMethod
	public override validate(): void {
		this.condition.validate();
		return assert.ok(this.condition.type.isSubtypeOf(TYPE.BOOL));
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
