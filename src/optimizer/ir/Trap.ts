import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	noopMethod,
	memoizeMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** Immediately halt the runtime program. */
export class Trap extends Value {
	public constructor() {
		super(OpCode.TRAP, TYPE.NOTHING);
	}

	@noopMethod(memoizeMethod)
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		return cg.module.unreachable();
	}

	public override asTac(): Trap {
		return this;
	}
}
