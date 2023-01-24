import type binaryen from 'binaryen';
import {InstructionExpression} from './InstructionExpression.js';



/**
 * Do nothing at runtime.
 */
export class InstructionNop extends InstructionExpression {
	/** The single instance of this class. */
	public static readonly INSTANCE: InstructionNop = new InstructionNop();


	private constructor() {
		super();
	}

	public override get isFloat(): boolean {
		return false;
	}

	/**
	 * @return `'(nop)'`
	 */
	public override toString(): string {
		return '(nop)';
	}

	public override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.nop();
	}
}
