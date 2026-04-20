import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {OpCode} from './Opcode.ts';
import {Terminator} from './Terminator.ts';



/** Transfer control to the given label, conditionally if specified. */
export class Goto extends Terminator {
	public constructor(private readonly label: string) {
		super(OpCode.GOTO);
	}

	public override toString(): string {
		return super.toString(`"${ this.label }"`);
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
