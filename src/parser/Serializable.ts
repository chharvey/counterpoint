import type {SyntaxNode} from 'tree-sitter';
import {stringifyAttributes} from './package.js';
import {Punctuator} from './Punctuator.js';



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
		.replace('\u0002', '\u2402') // U+0002 START OF TEXT // U+2402 SYMBOL FOR START OF TEXT
		.replace('\u0003', '\u2403') // U+0003 END   OF TEXT // U+2403 SYMBOL FOR END   OF TEXT
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



/**
 * Construct a new Serializable object given a SyntaxNode.
 * @param node the SyntaxNode to construct from
 * @return     the new Serializable object
 */
export function to_serializable(node: SyntaxNode): Serializable {
	return {
		tagname:      Object.values(Punctuator).find((punct) => punct === node.type) ? 'PUNCTUATOR' : node.type,
		source:       node.text,
		source_index: node.startIndex,
		line_index:   node.startPosition.row,
		col_index:    node.startPosition.column,
		serialize() {
			return `<${ this.tagname } ${ stringifyAttributes(new Map<string, string>([
				['line', (this.line_index + 1).toString()],
				['col',  (this.col_index  + 1).toString()],
			])) }>${ sanitizeContent(this.source) }</${ this.tagname }>`;
		},
	};
}
