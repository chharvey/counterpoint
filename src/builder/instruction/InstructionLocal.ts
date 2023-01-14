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
	constructor (name_or_id: bigint | string, op: InstructionExpression | boolean = false) {
		super((typeof name_or_id === 'bigint') ? `$var${ name_or_id.toString(16) }` : name_or_id, op);
	}
}
