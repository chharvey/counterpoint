import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {IrNode} from './IrNode.ts';
import type {Instruction} from './Instruction.ts';



/** A label to mark a location in the instruction list. */
export class Label extends IrNode implements Instruction {
	public constructor(public readonly name: string) {
		super();
	}

	public override toString(): string {
		return `"${ this.name }":`;
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
