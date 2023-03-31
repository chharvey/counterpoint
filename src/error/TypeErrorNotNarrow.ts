import type {TYPE} from '../typer/index.js';
import {TypeError} from './TypeError.js';



/**
 * A TypeErrorNotNarrow is thrown when one type is expected to narrow another type, but does not.
 * A general error used for different cases, such as compound types’s components, generic constraints, or throwing non-Exceptions.
 * @example
 * {"a" -> 1, "b" -> 2}.[1]; % TypeErrorNotNarrow: Type `1` is not a subtype of `"a" | "b"`.
 */
export class TypeErrorNotNarrow extends TypeError {
	/**
	 * Construct a new TypeErrorNotNarrow object.
	 * @param subtype   - the expected subtype
	 * @param supertype - the supertype
	 */
	public constructor(subtype: TYPE.Type, supertype: TYPE.Type, line_index: number, col_index: number) {
		super(
			`Type ${ subtype } is not a subtype of type ${ supertype }.`,
			TypeError.CODES.get(TypeErrorNotNarrow),
			line_index,
			col_index,
		);
	}
}
