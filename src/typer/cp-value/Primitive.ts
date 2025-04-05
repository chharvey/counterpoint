import {TYPE} from '../index.ts';
import {Value} from './Value.ts';



/**
 * Known subclasses:
 * - Null
 * - ValueBoolean
 * - ValueNumber
 * - ValueString
 */
export abstract class Primitive extends Value {
	/** @final */ public override toType(): TYPE.Unit<this> {
		return new TYPE.Unit<this>(this);
	}
}
