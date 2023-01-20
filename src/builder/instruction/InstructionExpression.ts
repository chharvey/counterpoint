import {Instruction} from './Instruction.js';



/**
 * Known subclasses:
 * - InstructionNop
 * - InstructionDrop
 * - InstructionConst
 * - InstructionVariable
 * - InstructionUnop
 * - InstructionBinop
 * - InstructionCond
 */
export abstract class InstructionExpression extends Instruction {
	abstract get isFloat(): boolean;
}
