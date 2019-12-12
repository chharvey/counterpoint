import Serializable from '../iface/Serializable.iface'
import {Char, STX, ETX} from './Scanner.class'
import Util from './Util.class'


/**
 * A Token object is the kind of thing that the Lexer returns.
 * It holds:
 * - the text of the token (self.cargo)
 * - the type of token that it is
 * - the line number and column index where the token starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_6.4
 */
export default abstract class Token implements Serializable {
	/** All the characters in this Token. */
	private _cargo: string;
	/** Zero-based line number of the first character (first line is line 0). */
	readonly line_index: number;
	/** Zero-based column number of the first character (first col is col 0). */
	readonly col_index: number;

	/**
	 * Construct a new Token object.
	 *
	 * @param tagname    - the name of the type of this Token
	 * @param start_char - the starting character of this Token
	 */
	constructor(
		private readonly tagname: string,
		start_char: Char,
	) {
		this._cargo     = start_char.cargo
		this.line_index = start_char.line_index
		this.col_index  = start_char.col_index
	}

	/**
	 * Get this Token’s cargo.
	 * @returns All the characters in this Token.
	 */
	get cargo(): string {
		return this._cargo
	}

	/**
	 * Add to this Token’s cargo.
	 * @param cargo the string to append
	 */
	add(cargo: string): void {
		this._cargo += cargo
	}

	/**
	 * @implements Serializable
	 */
	serialize(...attrs: string[]): string {
		const attributes: string = ' ' + [
			`line="${this.line_index+1}"`,
			`col="${this.col_index+1}"`,
			...attrs
		].join(' ').trim()
		return `<${this.tagname}${attributes}>${this.cargo}</${this.tagname}>`
	}
}
export interface TokenSubclass extends NewableFunction {
	readonly TAGNAME: string;
	/**
	 * Generate a random instance of this Token.
	 * @returns a well-formed string satisfying this Token class
	 */
	random(): string;
	new (char: Char): Token;
}
export const isTokenSubclass = (it: any): it is TokenSubclass => {
	return !!it && !!it.prototype && it.prototype.__proto__ === Token.prototype
}


export class TokenFilebound extends Token {
	static readonly TAGNAME: string = 'FILEBOUND'
	static readonly CHARACTERS: readonly string[] = [STX, ETX]
	static random(): string {
		return Util.arrayRandom(TokenFilebound.CHARACTERS)
	}
	value: boolean|null = null
	constructor(start_char: Char) {
		super(TokenFilebound.TAGNAME, start_char)
	}
	serialize(): string {
		const attributes: string = ' ' + [
			this.value !== null ? `value="${this.value}"` : ''
		].join(' ').trim()
		const contents: string = new Map<string, string>([
			[STX, '\u2402' /* SYMBOL FOR START OF TEXT */],
			[ETX, '\u2403' /* SYMBOL FOR END OF TEXT   */],
		]).get(this.cargo) !
		return `<${TokenFilebound.TAGNAME}${attributes}>${contents}</${TokenFilebound.TAGNAME}>`
	}
}
export class TokenWhitespace extends Token {
	static readonly TAGNAME: string = 'WHITESPACE'
	static readonly CHARACTERS: readonly string[] = [' ', '\t', '\n', '\r']
	static random(): string {
		return (Util.randomBool() ? '' : TokenWhitespace.random()) + Util.arrayRandom(TokenWhitespace.CHARACTERS)
	}
	constructor(start_char: Char) {
		super(TokenWhitespace.TAGNAME, start_char)
	}
}
export class TokenComment extends Token {
	static readonly TAGNAME: string = 'COMMENT'
	static random(): string {
		throw new Error('not yet supported')
	}
	constructor(start_char: Char) {
		super(TokenComment.TAGNAME, start_char)
	}
}
export class TokenString extends Token {
	static readonly TAGNAME: string = 'STRING'
	static random(): string {
		throw new Error('not yet supported')
	}
	value: string|null = null
	constructor(start_char: Char) {
		super(TokenString.TAGNAME, start_char)
	}
	serialize(): string {
		return super.serialize(this.value !== null ? `value="${this.value}"` : '')
	}
}
export class TokenNumber extends Token {
	static readonly TAGNAME: string = 'NUMBER'
	static readonly CHARACTERS: readonly string[] = '0 1 2 3 4 5 6 7 8 9'.split(' ')
	static random(): string {
		const digitSequenceDec = (): string =>
			(Util.randomBool() ? '' : digitSequenceDec()) + Util.arrayRandom(TokenNumber.CHARACTERS)
		return digitSequenceDec()
	}
	value: number|null = null
	constructor(start_char: Char) {
		super(TokenNumber.TAGNAME, start_char)
	}
	serialize(): string {
		return super.serialize(this.value !== null ? `value="${this.value}"` : '')
	}
}
export class TokenWord extends Token {
	static readonly TAGNAME: string = 'WORD'
	static readonly CHARACTERS_START: readonly string[] = ''.split(' ')
	static readonly CHARACTERS_REST : readonly string[] = ''.split(' ')
	static random(): string {
		throw new Error('not yet supported')
	}
	id: number|null = null
	constructor(start_char: Char) {
		super(TokenWord.TAGNAME, start_char)
	}
	serialize(): string {
		return super.serialize(this.id !== null ? `id="${this.id}"` : '')
	}
}
export class TokenPunctuator extends Token {
	static readonly TAGNAME: string = 'PUNCTUATOR'
	static readonly CHARACTERS_1: readonly string[] = '+ - * / ^ ( )'.split(' ')
	static readonly CHARACTERS_2: readonly string[] = ''.split(' ')
	static readonly CHARACTERS_3: readonly string[] = ''.split(' ')
	static random(): string {
		return Util.arrayRandom([
			...TokenPunctuator.CHARACTERS_1,
		])
	}
	constructor(start_char: Char) {
		super(TokenPunctuator.TAGNAME, start_char)
	}
}
