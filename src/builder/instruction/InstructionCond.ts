import {InstructionExpression} from './InstructionExpression.js';



/**
 * Perform a conditional operation on the stack.
 */
export class InstructionCond extends InstructionExpression {
	/**
	 * @param arg0 the condition
	 * @param arg1 the consequent
	 * @param arg2 the alterantive
	 */
	constructor (
		private readonly arg0: InstructionExpression,
		private readonly arg1: InstructionExpression,
		private readonly arg2: InstructionExpression,
	) {
		super()
		if ((this.arg1.isFloat || this.arg2.isFloat) && (!this.arg1.isFloat || !this.arg2.isFloat)) {
			throw new TypeError(`Both branches must be either integers or floats, but not a mix.\nOperands: ${ this.arg1 } ${ this.arg2 }`)
		}
	}
	/**
	 * @return `'(if (result {i32|f64}) ‹arg0› (then ‹arg1›) (else ‹arg2›))'`
	 */
	override toString(): string {
		return `(if (result ${ (!this.isFloat) ? `i32` : `f64` }) ${ this.arg0 } (then ${ this.arg1 }) (else ${ this.arg2 }))`
	}
	get isFloat(): boolean {
		return this.arg1.isFloat || this.arg2.isFloat
	}
}
