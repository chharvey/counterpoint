import type {Char} from '@chharvey/parser';
import {
	NonemptyArray,
	Serializable,
	stringifyAttributes,
	sanitizeContent,
} from './package.js';



/**
 * A Token object is the kind of thing that the Lexer returns.
 * It holds:
 * - the text of the token (self.cargo)
 * - the line number and column index where the token starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_6.4
 */
export class Token implements Serializable {
	/** @implements Serializable */
	readonly source_index: number;
	/** @implements Serializable */
	readonly line_index: number;
	/** @implements Serializable */
	readonly col_index: number;

	/** All the characters in this Token. */
	private _cargo: string;

	/**
	 * Construct a new Token object.
	 * @param tagname    The name of the type of this Token.
	 * @param chars      characters to add upon construction
	 * @throws           {LexError02} if the end of the file is reached before the end of the token
	 */
	constructor (
		/** @implements Serializable */
		readonly tagname: string,
		...chars: NonemptyArray<Char>
	) {
		this._cargo       = chars.map((char) => char.source).join('');
		this.source_index = chars[0].source_index;
		this.line_index   = chars[0].line_index;
		this.col_index    = chars[0].col_index;
	}

	/**
	 * Get the sum of this Token’s cargo.
	 * @implements Serializable
	 * @returns all the source characters in this Token
	 * @final
	 */
	get source(): string {
		return this._cargo;
	}

	/** @implements Serializable */
	serialize(): string {
		return `<${ this.tagname } ${ stringifyAttributes(new Map<string, string>([
			['line', (this.line_index + 1).toString()],
			['col',  (this.col_index  + 1).toString()],
		])) }>${ sanitizeContent(this.source) }</${ this.tagname }>`;
	}
}
