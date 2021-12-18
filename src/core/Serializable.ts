/**
 * A Serializable object is a piece of source code with a line and column number,
 * and can be serialized into a representation string.
 */
export interface Serializable {
	/** The name of the type of this Serializable. */
	readonly tagname: string;
	/** The concatenation of the source text of all children. */
	readonly source: string;
	/** The index of the first character/token in source text. */
	readonly source_index: number;
	/** Zero-based line number of the first character/token (first line is line 0). */
	readonly line_index: number;
	/** Zero-based column number of the first character/token (first col is col 0). */
	readonly col_index: number;

	/**
	 * Return an XML string of this object.
	 * @returns a string formatted as an XML element
	 */
	serialize(): string;
}
