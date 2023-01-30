import {INST} from './package.js';
import {Object as CPObject} from './Object.js';
import type {Number as CPNumber} from './index.js';



/**
 * Known subclasses:
 * - Null
 * - Boolean
 * - Number
 * - String
 */
export abstract class Primitive extends CPObject {
	protected abstract get builtValue(): CPNumber;

	/** @final */
	public override build(): INST.InstructionConst {
		return new INST.InstructionConst(this.builtValue);
	}
}
