import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	noopMethod,
	memoizeMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {ValueTac} from './ValueTac.ts';



/** Immediately halt the runtime program. */
export class Trap extends ValueTac {
	public constructor() {
		super(OpCode.TRAP, TYPE.NOTHING);
	}

	@noopMethod(memoizeMethod)
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		return cg.mod.unreachable();
	}

	public override asTac(): this {
		return this;
	}
}
