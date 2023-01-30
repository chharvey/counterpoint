import {InstructionExpression} from './InstructionExpression.js';



/**
 * Local variable operations.
 * Known subclasses:
 * - InstructionLocalGet
 * - InstructionLocalTee
 */
export abstract class InstructionLocal extends InstructionExpression {
	/** The variable name. */
	protected readonly name: string = `var${ this.index.toString(16) }`;

	public constructor(protected readonly index: number) {
		super();
	}
}
