import {Type} from './Type.ts';



/**
 * Parent class for value types (types of data that are passed by value).
 * Known subclasses:
 * - Nothing
 * - TypeBoolean
 * - TypeSymbol
 * - Integer
 * - Natural
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
