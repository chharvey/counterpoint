import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionVariable} from './InstructionVariable.js';



/**
 * Global variable operations.
 * Known subclasses:
 * - InstructionGlobalGet
 * - InstructionGlobalSet
 */
export abstract class InstructionGlobal extends InstructionVariable {
	public static friendlyName(id: bigint): string {
		return `glb${ id.toString(16) }`;
	}


	public constructor(id: bigint, op: InstructionExpression | boolean = false) {
		super(InstructionGlobal.friendlyName(id), op);
	}
}
