import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';



/** A label to mark a location in the instruction list. */
export class Label extends Instruction {
	public constructor(public readonly name: string) {
		super(OpCode.UNDEFINED);
	}

	public override toString(): string {
		return `"${ this.name }":`;
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
