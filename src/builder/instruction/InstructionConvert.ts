import binaryen from 'binaryen';
import {InstructionExpression} from './InstructionExpression.js';



/**
 * Convert an i32 into an f64.
 */
export class InstructionConvert extends InstructionExpression {
	public override readonly binType: binaryen.Type = binaryen.f64;

	/**
	 * @param expr the expression to convert
	 */
	public constructor(private readonly expr: InstructionExpression) {
		super();
		if (this.expr.binType !== binaryen.i32) {
			throw new TypeError(`Expected an argument of type \`i32\`; got: ${ this.expr }`);
		}
	}

	/**
	 * @return `'(f64.convert_i32_u ‹expr›)'`
	 */
	public override toString(): string {
		return `(f64.convert_i32_u ${ this.expr })`;
	}

	public override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.f64.convert_u.i32(this.expr.buildBin(mod));
	}
}
