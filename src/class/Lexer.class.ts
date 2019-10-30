import Scanner, {Char, STX, ETX} from './Scanner.class'

const whitespace: readonly string[] = [' ', '\t', '\n', '\r']

const digits_dec: readonly string[] = `0 1 2 3 4 5 6 7 8 9`.split(' ')

const word_starts: readonly string[] = ``.split(' ')
const word_chars: readonly string[] = ``.split(' ')

const punctuators1: readonly string[] = `+ - * / ^ ( )`.split(' ')
const punctuators2: readonly string[] = ``.split(' ')
const punctuators3: readonly string[] = ``.split(' ')


/**
 * A Token object is the kind of thing that the Lexer returns.
 * It holds:
 * - the text of the token (self.cargo)
 * - the type of token that it is
 * - the line number and column index where the token starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_6.4
 */
export abstract class Token {
	/** All the characters in this Token. */
	private _cargo: string;
	/** Zero-based line number of the first character (first line is line 0). */
	readonly line_index: number;
	/** Zero-based column number of the first character (first col is col 0). */
	readonly col_index: number;

	/**
	 * Construct a new Token object.
	 *
	 * @param start_char - the starting character of this Token
	 * @param tagname    - the name of the type of this Token
	 */
	constructor(private readonly tagname: string, start_char: Char) {
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
	 * Return an XML string of this token.
	 * @returns a string formatted as an XML element
	 */
	serialize(): string {
		const tagname: string = this.tagname
		const attributes: string = (this.cargo !== STX && this.cargo !== ETX) ? ' ' + [
			`line="${this.line_index+1}"`,
			`col="${this.col_index+1}"`,
		].join(' ') : ''
		const cargo: string = new Map<string, string>([
			[STX, '\u2402' /* SYMBOL FOR START OF TEXT */],
			[ETX, '\u2403' /* SYMBOL FOR END OF TEXT   */],
		]).get(this.cargo) || this.cargo
		return `<${tagname}${attributes}>${cargo}</${tagname}>`
	}
}
export class TokenFilebound  extends Token { constructor(start_char: Char) { super('FILEBOUND' , start_char) } }
export class TokenWhitespace extends Token { constructor(start_char: Char) { super('WHITESPACE', start_char) } }
export class TokenComment    extends Token { constructor(start_char: Char) { super('COMMENT'   , start_char) } }
export class TokenString     extends Token { constructor(start_char: Char) { super('STRING'    , start_char) } }
export class TokenNumber     extends Token { constructor(start_char: Char) { super('NUMBER'    , start_char) } }
export class TokenWord       extends Token { constructor(start_char: Char) { super('WORD'      , start_char) } }
export class TokenPunctuator extends Token { constructor(start_char: Char) { super('PUNCTUATOR', start_char) } }


/**
 * A lexer (aka: Tokenizer, Lexical Analyzer)
 * @see http://parsingintro.sourceforge.net/#contents_item_6.5
 */
export default class Lexer {
	/**
	 * Construct and return the next token in the sourceText.
	 * @param   sourceText - the entire source text
	 * @returns the next token, if it does not contain whitespace
	 */
	static * generate(sourceText: string): Iterator<Token> {
		const scanner: Iterator<Char> = Scanner.generate(sourceText)
		let character: IteratorResult<Char> = scanner.next()
		let c0: string = character.value.cargo
		let l1: Char|null = character.value.lookahead()
		let l2: Char|null = character.value.lookahead(2)
		let c1: string|null = l1 && l1.cargo
		let c2: string|null = l2 && l2.cargo
		/**
		 * Advance the lexer, scanning the next character and reassigning variables.
		 * @param   n the number of times to advance
		 * @throws  {RangeError} if the argument is not a positive integer
		 */
		function advance(n: number = 1): void {
			if (n % 1 !== 0 || n <= 0) throw new RangeError('Argument must be a positive integer.')
			if (n === 1) {
				character = scanner.next()
				if (!character.done) {
					c0 = character.value.cargo
					l1 = character.value.lookahead()
					l2 = character.value.lookahead(2)
					c1 = l1 && l1.cargo
					c2 = l2 && l2.cargo
				}
			} else {
				advance(n - 1)
				advance()
			}
		}
		while (!character.done) {
			if (whitespace.includes(c0)) {
				const wstoken = new TokenWhitespace(character.value)
				advance()
				while (!character.done && whitespace.includes(c0)) {
					wstoken.add(c0)
					advance()
				}
				// yield wstoken // only if we want the lexer to return whitespace
				continue;
			}

			let token: Token;
			if (c0 === STX || c0 === ETX) {
				token = new TokenFilebound(character.value)
				advance()
			// TODO comments
			} else if (digits_dec.includes(c0)) {
				token = new TokenNumber(character.value)
				advance()
				while (!character.done && digits_dec.includes(c0)) {
					token.add(c0)
					advance()
				}
			} else if (word_starts.includes(c0)) {
				token = new TokenWord(character.value)
				advance()
				while (!character.done && word_chars.includes(c0)) {
					token.add(c0)
					advance()
				}
			} else if (punctuators1.includes(c0)) {
				token = new TokenPunctuator(character.value)
				let first_char: string = c0
				advance() // read past the first character
				// TODO clean this up when we get to multi-char punctuators
				if (punctuators2.includes(first_char + c0)) {
					token.add(c0)
					let second_char: string = c0
					advance() // read past the second character
					if (punctuators3.includes(first_char + second_char + c0)) {
						token.add(c0)
						advance() // read past the third character
					}
				}
			} else {
				throw new Error(`I found a character or symbol that I do not recognize:
${c0} on ${character.value.line_index + 1}:${character.value.col_index + 1}.`)
			}
			yield token
		}
	}


	/**
	 * Construct a new Lexer object.
	 */
	private constructor() {
	}
}
