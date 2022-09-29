import {stringifyAttributes} from './utils-public.js';
import {Filebound} from './utils-private.js';



/**
 * Sanitize a string for the text content of an XML element.
 * @param   contents the original element contents
 * @returns          contents with XML special characters escaped
 */
function sanitizeContent(contents: string): string {
	return (contents
		.replace(/&/g,  '&amp;')
		.replace(/</g,  '&lt;')
		.replace(/>/g,  '&gt;')
		.replace(/\\/g, '&#x5c;')
		.replace(Filebound.SOT, '\u2402') // SYMBOL FOR START OF TEXT
		.replace(Filebound.EOT, '\u2403') // SYMBOL FOR END   OF TEXT
	);
}



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


export function serialize(serializable: Serializable, content: string): string {
	return `<${ serializable.tagname } ${ stringifyAttributes(new Map<string, string>([
		['line', (serializable.line_index + 1).toString()],
		['col',  (serializable.col_index  + 1).toString()],
	])) }>${ sanitizeContent(content) }</${ serializable.tagname }>`;
}
