import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {IrNode} from './IrNode.ts';
import type {Instruction} from './Instruction.ts';
import type {Label} from './Label.ts';



/** Transfer control to the given label. */
export class Goto extends IrNode implements Instruction {
	public constructor(private readonly label: Label) {
		super();
	}

	public override toString(): string {
		return `goto "${ this.label.name }".`;
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
