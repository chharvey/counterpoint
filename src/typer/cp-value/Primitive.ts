import {TYPE} from '../index.js';
import {Value} from './Value.js';



/**
 * Known subclasses:
 * - Null
 * - ValueBoolean
 * - ValueSymbol
 * - ValueNumber
 * - ValueString
 */
export abstract class Primitive extends Value {
	/** @final */ public override toType(): TYPE.Unit<this> {
		return new TYPE.Unit<this>(this);
	}
}
