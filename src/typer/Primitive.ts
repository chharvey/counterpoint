import {
	INST,
} from './package.js';
import type {
	SolidNull,
	SolidNumber,
} from './index.js';
import {SolidObject} from './SolidObject.js';



/**
 * Known subclasses:
 * - SolidNull
 * - SolidBoolean
 * - Int16
 * - Float64
 * - SolidString
 */
export abstract class Primitive extends SolidObject {
	protected abstract get builtValue(): SolidNull | SolidNumber;

	/** @final */
	public override build(): INST.InstructionConst {
		return new INST.InstructionConst(this.builtValue);
	}
}
