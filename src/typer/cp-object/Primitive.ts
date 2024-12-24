import {TYPE} from '../index.js';
import {Object as CPObject} from './Value.js';



/**
 * Known subclasses:
 * - Null
 * - Boolean
 * - Number
 * - String
 */
export abstract class Primitive extends CPObject {
	/** @final */ public override toType(): TYPE.TypeUnit<this> {
		return new TYPE.TypeUnit<this>(this);
	}
}
