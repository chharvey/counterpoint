import type {TYPE} from '../typer/index.js';
import {TypeError} from './TypeError.js';



/**
 * A TypeErrorNotNarrow is thrown when one type is expected to narrow another type, but does not.
 * A general error used for different cases, such as compound types’s components, generic constraints, or throwing non-Exceptions.
 */
export class TypeErrorNotNarrow extends TypeError {
	/** The number series of this class of errors. */
	public static override readonly CODE = 2;
	/**
	 * Construct a new TypeErrorNotNarrow object.
	 * @param subtype   - the expected subtype
	 * @param supertype - the supertype
	 */
	public constructor(subtype: TYPE.Type, supertype: TYPE.Type, line_index: number, col_index: number) {
		super(`Type ${ subtype } is not a subtype of type ${ supertype }.`, TypeErrorNotNarrow.CODE, line_index, col_index);
	}
}