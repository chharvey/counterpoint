import type binaryen from 'binaryen';



/**
 * Known subclasses:
 * - InstructionExpression
 * - InstructionDeclareGlobal
 * - InstructionDeclareLocal
 * - InstructionFunction
 * - InstructionModule
 */
export abstract class Instruction {
	/**
	 * Modify the compiled module with this instruction.
	 * @param _mod the binaryen module to modify
	 */
	abstract buildBin(_mod: binaryen.Module): binaryen.ExpressionRef | binaryen.GlobalRef | binaryen.FunctionRef;
}
