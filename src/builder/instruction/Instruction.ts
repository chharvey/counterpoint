import type binaryen from 'binaryen';



/**
 * Known subclasses:
 * - InstructionUnreachable
 * - InstructionNop
 * - InstructionExpression
 * - InstructionStatement
 * - InstructionDeclareGlobal
 * - InstructionDeclareLocal
 * - InstructionModule
 */
export abstract class Instruction {
	/**
	 * Modify the compiled module with this instruction.
	 * @param _mod the binaryen module to modify
	 */
	abstract buildBin(_mod: binaryen.Module): binaryen.ExpressionRef;
}
