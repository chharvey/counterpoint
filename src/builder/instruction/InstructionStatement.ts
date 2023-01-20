import * as xjs from 'extrajs';
import {Instruction} from './Instruction.js';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionGlobalSet} from './InstructionGlobalSet.js';



/**
 * Create a new operand stack.
 */
export class InstructionStatement extends Instruction {
	/**
	 * @param count the index of the statement within its scope
	 * @param expr the expression
	 */
	public constructor(
		private readonly count: bigint,
		private readonly expr: InstructionExpression,
	) {
		super();
	}

	/**
	 * @return a new function evaluating the argument
	 */
	public override toString(): string {
		const result: string = (this.expr instanceof InstructionGlobalSet)
			? ''
			: `(result ${ (this.expr.isFloat) ? 'f64' : 'i32' })`;
		return xjs.String.dedent`
			(func (export "f${ this.count }") ${ result }
				${ this.expr }
			)
		`;
	}
}
