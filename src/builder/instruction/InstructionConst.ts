import binaryen from 'binaryen';
import {
	SolidNull,
	SolidNumber,
	Float64,
} from './package.js';
import {InstructionExpression} from './InstructionExpression.js';



/**
 * Push a constant onto the stack.
 */
export class InstructionConst extends InstructionExpression {
	/**
	 * @param value the constant to push
	 */
	public constructor(private readonly value: SolidNull | SolidNumber) {
		super()
	}
	/**
	 * @return `'({i32|f64}.const ‹value›)'`
	 */
	override toString(): string {
		return (this.value instanceof SolidNull)
			? '(ref.null func)'
			: `(${ (!this.isFloat) ? 'i32' : 'f64' }.const ${ (this.value.identical(new Float64(-0.0))) ? '-0.0' : this.value })`;
	}
	get isFloat(): boolean {
		return this.value instanceof Float64
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		if (this.value instanceof SolidNull) {
			return mod.ref.null(binaryen.funcref);
		}
		if (this.value.identical(new Float64(-0.0))) {
			return mod.f64.ceil(mod.f64.const(-0.5)); // -0.0
		}
		return mod[(!this.isFloat) ? 'i32' : 'f64'].const(Number(this.value.toString()));
	}
}
