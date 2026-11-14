import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import type {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Call a function or constructor. */
export class Call extends Value {
	public constructor(
		public readonly callable: ValueTac,
		public readonly args:     readonly ValueTac[],
		return_type: TYPE.Type,
	) {
		super(OpCode.CALL, return_type);
	}

	public override toString(): string {
		return super.toString(this.callable, ...this.args);
	}

	public override interpret(_interp: Interpreter): VALUE.Value {
		throw new Error('`OP.Call#interpret` is not yet supported.');
	}

	@memoizeMethod
	public override codegen(_: CodeGenerator): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
