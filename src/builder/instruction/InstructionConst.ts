import {
	throw_expression,
	OBJ,
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
	public static fromCPValue(value: OBJ.Object | null, to_float: boolean = false): InstructionConst {
		if (!value) {
			throw new Error('Cannot build an abrupt completion structure.');
		}
		const numeric: OBJ.Number = (
			(value instanceof OBJ.Null)    ? OBJ.Integer.ZERO :
			(value instanceof OBJ.Boolean) ? (value.isTruthy) ? OBJ.Integer.UNIT : OBJ.Integer.ZERO :
			(value instanceof OBJ.Number)  ? value :
			throw_expression(new Error('not yet supported.'))
		);
		return new InstructionConst((to_float) ? numeric.toFloat() : numeric);
	}

	/**
	 * @param value the constant to push
	 */
	public constructor(private readonly value: OBJ.Number) {
		super();
	}

	/**
	 * @return `'({i32|f64}.const ‹value›)'`
	 */
	public override toString(): string {
		return `(${ (!this.isFloat) ? 'i32' : 'f64' }.const ${ (this.value.identical(new OBJ.Float(-0.0))) ? '-0.0' : this.value })`;
	}

	public get isFloat(): boolean {
		return this.value instanceof OBJ.Float;
	}
}
