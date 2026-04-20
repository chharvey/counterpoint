import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';
import type {Label} from './Label.ts';



/** Transfer control to the given label, conditionally if specified. */
export class Goto extends Instruction {
	public constructor(private readonly label: Label) {
		super(OpCode.UNDEFINED);
	}

	public override toString(): string {
		return `goto "${ this.label.name }".`;
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
