import {Type} from './Type.js';



/**
 * Parent class for value types (types of objects that are passed by value).
 * Known subclasses:
 * - TypeUnit
 * - TypeNever
 * - TypeVoid
 * - TypeBoolean
 * - TypeInteger
 * - TypeFloat
 * - TypeString
 * - TypeTuple
 * - TypeRecord
 */
export abstract class ValueType extends Type {
	public override get isReference(): boolean {
		return false;
	}
}
