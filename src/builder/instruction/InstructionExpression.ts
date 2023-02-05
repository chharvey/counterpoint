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
	public get binTypeString(): 'i32' | 'f64' {
		return new Map<binaryen.Type, 'i32' | 'f64'>([
			[binaryen.i32, 'i32'],
			[binaryen.f64, 'f64'],
		]).get(this.binType) ?? throwUnsupportedType(this.binType);
	}
}
