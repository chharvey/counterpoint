import type {TYPE} from './package.js';
import {SolidTypeError} from './SolidTypeError.js';



/**
 * A TypeError02 is thrown when one type is expected to narrow another type, but does not.
 * A general error used for different cases, such as compound types’s components, generic constraints, or throwing non-Exceptions.
 */
export class TypeError02 extends SolidTypeError {
	/** The number series of this class of errors. */
	static override readonly CODE = 2;
	/**
	 * Construct a new TypeError02 object.
	 * @param subtype   - the expected subtype
	 * @param supertype - the supertype
	 */
	constructor (subtype: TYPE.SolidType, supertype: TYPE.SolidType, line_index: number, col_index: number) {
		super(`Type ${ subtype } is not a subtype of type ${ supertype }.`, TypeError02.CODE, line_index, col_index)
	}
}
