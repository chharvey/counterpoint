import type binaryen from 'binaryen';
import {
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
	constructor (private readonly value: SolidNumber) {
		super()
	}
	/**
	 * @return `'({i32|f64}.const ‹value›)'`
	 */
	override toString(): string {
		return `(${ (!this.isFloat) ? 'i32' : 'f64' }.const ${ (this.value.identical(new Float64(-0.0))) ? '-0.0' : this.value })`
	}
	get isFloat(): boolean {
		return this.value instanceof Float64
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		if (this.value.identical(new Float64(-0.0))) {
			return mod.f64.ceil(-0.5); // -0.0
		}
		return mod[(!this.isFloat) ? 'i32' : 'f64'].const(Number(this.value.toString()));
	}
}
