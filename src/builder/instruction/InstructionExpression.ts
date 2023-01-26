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
	abstract get isFloat(): boolean;

	/** @final */
	public get binType(): binaryen.Type {
		return (!this.isFloat) ? binaryen.i32 : binaryen.f64;
	}
}
