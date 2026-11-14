import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a Maybe. */
export class MaybeNew extends Value {
	public constructor(
		typ: TYPE.Type,
		public readonly value?: ValueTac,
	) {
		super(OpCode.MAYBE_NEW, new TYPE.Maybe(typ));
	}


	public override toString(): string {
		return super.toString(this.value ?? '');
	}

	public override interpret(interp: Interpreter): VALUE.Maybe {
		return this.value
			? new VALUE.Some(this.value.interpret(interp))
			: new VALUE.None((this.type as TYPE.Maybe).typearg);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.codegenMaybe(this.value?.codegen(cg));
	}
}
