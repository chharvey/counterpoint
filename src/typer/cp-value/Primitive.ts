import {TYPE} from '../index.js';
import {Value} from './Value.js';



/**
 * Known subclasses:
 * - Null
 * - ValueBoolean
 * - ValueNumber
 * - ValueString
 */
export abstract class Primitive extends Value {
	/** @final */ public override toType(): TYPE.TypeUnit<this> {
		return new TYPE.TypeUnit<this>(this);
	}
}
