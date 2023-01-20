import {Instruction} from './Instruction.js';



/**
 * Known subclasses:
 * - InstructionConst
 * - InstructionVariable
 * - InstructionUnop
 * - InstructionBinop
 * - InstructionCond
 */
export abstract class InstructionExpression extends Instruction {
	public abstract get isFloat(): boolean;
}
