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
	public override build(to_float: boolean = false): INST.InstructionConst {
		return new INST.InstructionConst((to_float) ? this.builtValue.toFloat() : this.builtValue);
	}
}
