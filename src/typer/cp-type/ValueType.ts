import {Type} from './Type.js';



/**
 * Parent class for value types (types of objects that are passed by value).
 * Known subclasses:
 * - TypeNever
 * - TypeVoid
 * - TypeBoolean
 * - TypeInteger
 * - TypeFloat
 * - TypeString
 * - TypeUnit
 * - TypeTuple
 * - TypeRecord
 */
export abstract class ValueType extends Type {
	/** @final */
	public override get isReference(): boolean {
		return false;
	}
}
