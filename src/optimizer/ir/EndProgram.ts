import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {OpCode} from './Opcode.ts';
import {Terminator} from './Terminator.ts';



/** Transfer control to the given label, conditionally if specified. */
export class EndProgram extends Terminator {
	public constructor() {
		super(OpCode.ENDPROGRAM);
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
