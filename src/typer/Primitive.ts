import {SolidTypeUnit} from './SolidTypeUnit.js';
import {SolidObject} from './SolidObject.js';



/**
 * Known subclasses:
 * - SolidNull
 * - SolidBoolean
 * - Int16
 * - Float64
 * - SolidString
 */
export abstract class Primitive extends SolidObject {
	/** @final */ public override toType(): SolidTypeUnit<this> {
		return new SolidTypeUnit<this>(this);
	}
}
