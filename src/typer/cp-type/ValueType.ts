import {Type} from './Type.js';



/**
 * Parent class for value types (types of data that are passed by value).
 * Known subclasses:
 * - Never
 * - Void
 * - TypeBoolean
 * - TypeSymbol
 * - Integer
 * - Float
 * - TypeString
 * - Unit
 * - TypeTuple
 * - TypeRecord
 */
export abstract class ValueType extends Type {
	/** @final */
	public override get isReference(): boolean {
		return false;
	}
}
