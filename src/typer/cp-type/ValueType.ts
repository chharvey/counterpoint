import {Type} from './Type.js';



/**
 * Parent class for value types (types of objects that are passed by value).
 */
export abstract class ValueType extends Type {
	public override get isReference(): boolean {
		return false;
	}
}
