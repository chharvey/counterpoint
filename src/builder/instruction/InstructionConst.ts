import {
	SolidObject,
	SolidNull,
	SolidBoolean,
	SolidNumber,
	Int16,
	Float64,
} from './package.js';
import {InstructionExpression} from './InstructionExpression.js';



/**
 * Push a constant onto the stack.
 */
export class InstructionConst extends InstructionExpression {
	/**
	 * Construct a new InstructionConst given an assessed Counterpoint value.
	 * @param value the Counterpoint value
	 * @param to_float Should the value be type-coerced into a floating-point number?
	 * @return the directions to print
	 */
	static fromCPValue(value: SolidObject | null, to_float: boolean = false): InstructionConst {
		if (!value) {
			throw new Error('Cannot build an abrupt completion structure.')
		}
		const numeric: SolidNumber =
			(value instanceof SolidNull)    ? Int16.ZERO :
			(value instanceof SolidBoolean) ? (value.isTruthy) ? Int16.UNIT : Int16.ZERO :
			(value instanceof SolidNumber)  ? value :
			(() => { throw new Error('not yet supported.') })()
		return new InstructionConst((to_float) ? numeric.toFloat() : numeric)
	}
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
