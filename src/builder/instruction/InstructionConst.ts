import binaryen from 'binaryen';
import {
	SolidNumber,
	Float64,
} from './package.js';
import {InstructionExpression} from './InstructionExpression.js';



/**
 * Push a constant onto the stack.
 */
export class InstructionConst extends InstructionExpression {
	public override readonly binType: binaryen.Type = (!(this.value instanceof Float64)) ? binaryen.i32 : binaryen.f64

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
		return `(${ this.binTypeString }.const ${ (this.value.identical(new Float64(-0.0))) ? '-0.0' : this.value })`;
	}

	override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		if (this.value.identical(new Float64(-0.0))) {
			return mod.f64.ceil(mod.f64.const(-0.5)); // -0.0
		}
		return mod[this.binTypeString].const(Number(this.value.toString()));
	}
}
