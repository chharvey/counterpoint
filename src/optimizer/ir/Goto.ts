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
export class Goto extends Instruction {
	public constructor(
		private readonly label:             Label,
		private readonly conditionIfFalse?: Value,
	) {
		super(OpCode.UNDEFINED);
	}

	public override toString(): string {
		return `${ this.conditionIfFalse ? `if_false ${ this.conditionIfFalse }, ` : '' }goto "${ this.label.name }".`;
	}

	@runOnceMethod
	public override validate(): void {
		if (this.conditionIfFalse) {
			this.conditionIfFalse.validate();
			return assert.ok(this.conditionIfFalse.type.isSubtypeOf(TYPE.BOOL));
		}
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		// Loops:
		/*
			;; if `doFirst`:
			(block $exit
				(loop $repeat
					(block $body ‹body›) ;; `break;` --> `(br $exit)`, `skip;` --> `(br $body)`
					(br_if $exit (not ‹cond›))
					(br $repeat)
				)
			)
			;; else:
			(block $exit
				(loop $repeat
					(br_if $exit (not ‹cond›))
					(block $body ‹body›) ;; `break;` --> `(br $exit)`, `skip;` --> `(br $body)`
					(br $repeat)
				)
			)
		*/
		throw new Error('not yet supported.');
	}
}
