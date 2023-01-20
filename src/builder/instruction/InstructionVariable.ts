import {InstructionExpression} from './InstructionExpression.js';



/**
 * Variable operations.
 * Known subclasses:
 * - InstructionGlobal
 * - InstructionLocal
 */
export abstract class InstructionVariable extends InstructionExpression {
	/**
	 * @param name the variable name (must begin with `'$'`)
	 * @param op an optional expression to manipulate, or a type to declare
	 */
	public constructor(
		protected readonly name: string,
		protected readonly op: InstructionExpression | boolean = false,
	) {
		super();
	}

	public get isFloat(): boolean {
		return this.op instanceof InstructionExpression ? this.op.isFloat : this.op;
	}
}
