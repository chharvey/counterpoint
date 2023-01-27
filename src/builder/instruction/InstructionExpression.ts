import binaryen from 'binaryen';
import {Instruction} from './Instruction.js';



/**
 * Known subclasses:
 * - InstructionConst
 * - InstructionLocal
 * - InstructionUnop
 * - InstructionBinop
 * - InstructionCond
 */
export abstract class InstructionExpression extends Instruction {
	abstract get isFloat(): boolean;

	public get binType(): binaryen.Type {
		return (!this.isFloat) ? binaryen.i32 : binaryen.f64;
	}
}
