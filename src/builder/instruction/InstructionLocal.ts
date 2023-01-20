import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionVariable} from './InstructionVariable.js';
import {InstructionDeclareLocal} from './index.js';



/**
 * Local variable operations.
 * Known subclasses:
 * - InstructionLocalGet
 * - InstructionLocalSet
 * - InstructionLocalTee
 */
export abstract class InstructionLocal extends InstructionVariable {
	public constructor(
		protected readonly index: bigint,
		op: InstructionExpression | boolean = false,
	) {
		super(InstructionDeclareLocal.friendlyName(index), op);
	}
}
