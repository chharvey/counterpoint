import binaryen from 'binaryen';
import {InstructionExpression} from './InstructionExpression.js';



/**
 * Perform a conditional operation on the stack.
 */
export class InstructionCond extends InstructionExpression {
	public override readonly binType: typeof binaryen.i32 | typeof binaryen.f64 = (![this.arg1.binType, this.arg2.binType].includes(binaryen.f64)) ? binaryen.i32 : binaryen.f64;

	/**
	 * @param arg0 the condition
	 * @param arg1 the consequent
	 * @param arg2 the alterantive
	 */
	public constructor(
		private readonly arg0: InstructionExpression,
		private readonly arg1: InstructionExpression,
		private readonly arg2: InstructionExpression,
	) {
		super();
		if (this.arg1.binType !== this.arg2.binType) {
			throw new TypeError(`Both branches must be the same type.\nOperands: ${ this.arg1 } ${ this.arg2 }`);
		}
	}

	/**
	 * @return `'(if (result {i32|f64}) ‹arg0› (then ‹arg1›) (else ‹arg2›))'`
	 */
	public override toString(): string {
		return `(if (result ${ this.binTypeString }) ${ this.arg0 } (then ${ this.arg1 }) (else ${ this.arg2 }))`;
	}

	public override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.if(this.arg0.buildBin(mod), this.arg1.buildBin(mod), this.arg2.buildBin(mod));
	}
}
