import Serializable from '../iface/Serializable.iface'

import {STX, ETX} from './Scanner.class'
import Token from './Token.class'


/**
 * A ParseNode is a node in a parse tree for a given input stream.
 * It holds:
 * - the group of child inputs ({@link Token}s and/or other ParseNodes)
 * - the line number and column index where the text code of the node starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_8.2
 */
export default class ParseNode implements Serializable {
	/** The concatenation of the source text of all children. */
	readonly source: string;
	/** Zero-based line number of the first token (first line is line 0). */
	readonly line_index: number;
	/** Zero-based column number of the first token (first col is col 0). */
	readonly col_index: number;
	/**
	 * Construct a new ParseNode object.
	 *
	 * @param tagname  - The name of the type of this ParseNode.
	 * @param children - The set of child inputs that creates this ParseNode.
	 */
	constructor(
		private readonly tagname: string,
		readonly children: readonly (Token|ParseNode)[],
	) {
		this.source = this.children.map((child) =>
			(typeof child === 'string') ? child :
			child.source
		).join(' ')
		this.line_index = this.children[0].line_index
		this.col_index  = this.children[0].col_index
	}
	/**
	 * @implements Serializable
	 */
	serialize(...attrs: string[]): string {
		const tagname: string = this.tagname
		const attributes: string = (tagname !== 'FILE') ? ' ' + [
			`line="${this.line_index+1}"`,
			`col="${this.col_index+1}"`,
			`source="${
				this.source
					.replace(STX, '\u2402') /* SYMBOL FOR START OF TEXT */
					.replace(ETX, '\u2403') /* SYMBOL FOR START OF TEXT */
			}"`,
			...attrs
		].join(' ').trim() : ''
		const contents: string = this.children.map((child) =>
			(typeof child === 'string') ? child : child.serialize()
		).join('')
		return `<${tagname}${attributes}>${contents}</${tagname}>`
	}
}
