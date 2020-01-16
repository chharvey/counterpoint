import Serializable from '../iface/Serializable.iface'

import {STX, ETX} from './Scanner.class'
import Translator from './Translator.class'
import Token from './Token.class'

import {
	ProductionGoal,
} from './Production.class'


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
	serialize(): string {
		const attributes: string = ' ' + [
			(this.tagname !== ProductionGoal.instance.displayName) ? `line="${this.line_index + 1}"` : '',
			(this.tagname !== ProductionGoal.instance.displayName) ?  `col="${this.col_index  + 1}"` : '',
			`source="${this.source
				.replace(/\&/g, '&amp;' )
				.replace(/\</g, '&lt;'  )
				.replace(/\>/g, '&gt;'  )
				.replace(/\'/g, '&apos;')
				.replace(/\"/g, '&quot;')
				.replace(/\\/g, '&#x5c;')
				.replace(/\t/g, '&#x09;')
				.replace(/\n/g, '&#x0a;')
				.replace(/\r/g, '&#x0d;')
				.replace(/\u0000/g, '&#x00;')
				.replace(STX, '\u2402') /* SYMBOL FOR START OF TEXT */
				.replace(ETX, '\u2403') /* SYMBOL FOR START OF TEXT */
			}"`,
		].join(' ').trim()
		const contents: string = this.children.map((child) => child.serialize()).join('')
		return `<${this.tagname}${attributes}>${contents}</${this.tagname}>`
	}
}
