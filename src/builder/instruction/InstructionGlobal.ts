import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionVariable} from './InstructionVariable.js';



/**
 * Global variable operations.
 * Known subclasses:
 * - InstructionGlobalGet
 * - InstructionGlobalSet
 */
export abstract class InstructionGlobal extends InstructionVariable {
	public constructor (name_or_id: bigint | string, op: InstructionExpression | boolean = false) {
		super((typeof name_or_id === 'bigint') ? `$glb${ name_or_id.toString(16) }` : name_or_id, op);
	}
}
