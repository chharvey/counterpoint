import binaryen from 'binaryen';
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

	/** @final */
	public get binType(): typeof binaryen.i32 | typeof binaryen.f64 {
		return (!this.isFloat) ? binaryen.i32 : binaryen.f64;
	}
}
