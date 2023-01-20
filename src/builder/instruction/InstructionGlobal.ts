import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionVariable} from './InstructionVariable.js';
import {InstructionDeclareGlobal} from './index.js';



/**
 * Global variable operations.
 * Known subclasses:
 * - InstructionGlobalGet
 * - InstructionGlobalSet
 */
export abstract class InstructionGlobal extends InstructionVariable {
	public constructor(id: bigint, op: InstructionExpression | boolean = false) {
		super(InstructionDeclareGlobal.friendlyName(id), op);
	}
}
