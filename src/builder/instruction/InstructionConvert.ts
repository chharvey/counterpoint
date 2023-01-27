import type binaryen from 'binaryen';
import {InstructionExpression} from './InstructionExpression.js';



/**
 * Convert an i32 into an f64.
 */
export class InstructionConvert extends InstructionExpression {
	/**
	 * @param expr the expression to convert
	 */
	public constructor(private readonly expr: InstructionExpression) {
		super();
	}

	/**
	 * @return `'(f64.convert_i32_u ‹expr›)'`
	 */
	public override toString(): string {
		return `(f64.convert_i32_u ${ this.expr })`;
	}

	public get isFloat(): boolean {
		return true;
	}

	public override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.f64.convert_u.i32(this.expr.buildBin(mod));
	}
}
