import type binaryen from 'binaryen';
import {InstructionExpression} from './InstructionExpression.js';



/**
 * Throw away the item on the top of the stack.
 */
export class InstructionDrop extends InstructionExpression {
	/**
	 * @param arg the value to drop
	 */
	public constructor(private readonly arg: InstructionExpression) {
		super();
	}

	public override get isFloat(): boolean {
		return false;
	}

	/**
	 * @return `'(drop ‹value›)'`
	 */
	public override toString(): string {
		return `(drop ${ this.arg })`;
	}

	public override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.drop(this.arg.buildBin(mod));
	}
}
