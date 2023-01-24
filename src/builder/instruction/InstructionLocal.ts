import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionVariable} from './InstructionVariable.js';



/**
 * Local variable operations.
 * Known subclasses:
 * - InstructionLocalGet
 * - InstructionLocalSet
 * - InstructionLocalTee
 */
export abstract class InstructionLocal extends InstructionVariable {
	public static friendlyName(index: number): string {
		return `var${ index.toString(16) }`;
	}


	public constructor(
		protected readonly index: number,
		op: InstructionExpression | boolean = false,
	) {
		super(InstructionLocal.friendlyName(index), op);
	}
}
