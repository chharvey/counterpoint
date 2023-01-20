import {OBJ} from './package.js';
import {InstructionExpression} from './InstructionExpression.js';



/**
 * Push a constant onto the stack.
 */
export class InstructionConst extends InstructionExpression {
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
