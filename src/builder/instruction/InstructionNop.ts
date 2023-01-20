import type binaryen from 'binaryen';
import {InstructionExpression} from './InstructionExpression.js';



/**
 * Do nothing at runtime.
 */
export class InstructionNop extends InstructionExpression {
	public override get isFloat(): boolean {
		return false;
	}

	/**
	 * @return `'(nop)'`
	 */
	override toString(): string {
		return `(nop)`
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.nop();
	}
}
