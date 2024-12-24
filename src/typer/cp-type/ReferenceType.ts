import {Type} from './Type.js';



/**
 * Parent class for reference types (types of objects that are passed by reference).
 * Known subclasses:
 * - TypeUnknown
 * - TypeObject
 * - TypeList
 * - TypeDict
 * - TypeSet
 * - TypeMap
 */
export abstract class ReferenceType extends Type {
	/** @final */
	public override get isReference(): boolean {
		return true;
	}
}
