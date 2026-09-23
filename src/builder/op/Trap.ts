import type * as binaryen from 'binaryen.ts';
import {
	type CodeGenerator,
	ErrorCode,
} from '../../index.ts';
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

	public override interpret(): never {
		throw new ErrorCode('Trap.');
	}

	@noopMethod(memoizeMethod)
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.mod.wasm.unreachable();
	}

	public override asTac(): this {
		return this;
	}
}
