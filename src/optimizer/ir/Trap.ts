import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	noopMethod,
	memoizeMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Immediately halt the runtime program. */
export class Trap extends Value {
	public constructor() {
		super(TYPE.UNKNOWN);
	}

	public override toString(): string {
		return `(${ TypeName[TypeName.TRAP] })`;
	}

	@noopMethod(memoizeMethod)
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		return cg.module.unreachable();
	}

	public override asTac(): Trap {
		return this;
	}
}
