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
}
