import binaryen from 'binaryen';
import {throwUnsupportedType} from './utils-private.js';
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
	public abstract readonly binType: binaryen.Type;

	/** @final */
	public get binTypeString() {
		return new Map([
			[binaryen.i32, 'i32'],
			[binaryen.f64, 'f64'],
		] as const).get(this.binType) ?? throwUnsupportedType(this.binType);
	}
}
