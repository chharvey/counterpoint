import Scanner, { Char } from './Scanner.class'

/** ENDMARK character signifies end of file. */
const ENDMARK: '\u0003' = '\u0003'

const one_char_symbols: readonly string[] = `+ *`.split(' ')
const two_char_symbols: readonly string[] = ``.split(' ')
const three_char_symbols: readonly string[] = ``.split(' ')

const keywords: readonly string[] = ``.split(' ')
const identifier_chars: readonly string[] = `0 1 2 3 4 5 6 7 8 9`.split(' ')
const identifier_starts: readonly string[] = `0 1 2 3 4 5 6 7 8 9`.split(' ')
const whitespace: readonly string[] = [' ', '\t', '\n']

export enum TokenType {
	SYMBOL     ,
	KEYWORD    ,
	STRING     ,
	IDENTIFIER ,
	NUMBER     ,
	WHITESPACE ,
	COMMENT    ,
	EOF        ,
}

/**
 * A Token object is the kind of thing that the Lexer returns.
 * It holds:
 * - the text of the token (self.cargo)
 * - the type of token that it is
 * - the line number and column index where the token starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_6.4
 */
class Token {
	/** All the characters in this Token. */
	cargo: string;
	/** The index of the line the first character is on. */
	readonly lineIndex: number;
	/** The index of the column the first character is on. */
	readonly colIndex: number;
	/** The token type. */
	type: TokenType|null;

	/**
	 * Construct a new Token object.
	 *
	 * @param startChar  The starting character of this Token.
	 */
	constructor(startChar: Char) {
		this.cargo      = startChar.cargo
		this.lineIndex  = startChar.lineIndex
		this.colIndex   = startChar.colIndex
		this.type       = null
	}


	show(showLineNumbers = false) {
		const s: string = (showLineNumbers)
			? `    ${this.lineIndex+1}    ${this.colIndex+1}    ` // for some dumb reason, lines and cols start at 1 instad of 0
			: ''
		return s  + `${TokenType[this.type || TokenType.SYMBOL]}: ${this.cargo}`
	}
}


/**
 * A lexer (aka: Tokenizer, Lexical Analyzer)
 */
export default class Lexer {
	/** The scanner generator for this lexer. */
	readonly scanner: Iterator<[Char, Char|null]>;
	/** The current iterator result. */
	character: IteratorResult<[Char, Char|null]>;
	/** The current character’s cargo. */
	c1: string;
	/** The lookahead cargo. */
	c2: string|null;

	/**
	 * Construct a new Lexer object.
	 *
	 * @param sourceText  The entire source text.
	 */
	constructor(readonly sourceText: string) {
		this.scanner = Scanner.generator(sourceText)
		this.character = this.scanner.next()
		this.c1 = this.character.value[0].cargo
		this.c2 = (this.character.value[1] !== null) ? this.c1 + this.character.value[1].cargo : null
	}

	/**
	 * Construct and return the next token in the sourceText.
	 * @return the next token, or `null` if the token contains whitespace
	 */
	get(): Token {
		/* read past and ignore any whitespace characters or any comments */
		while (whitespace.includes(this.c1)) {
			const wstoken = new Token(this.character.value[0])
			wstoken.type = TokenType.WHITESPACE
			this.getChar()
			while (whitespace.includes(this.c1)) {
				wstoken.cargo += this.c1
				this.getChar()
			}
		}

		const token = new Token(this.character.value[0])
		if (this.c1 === ENDMARK) {
			token.type = TokenType.EOF
		}
		// TODO comments
		else if (identifier_starts.includes(this.c1)) {
			token.type = TokenType.IDENTIFIER
			this.getChar()
			while (identifier_chars.includes(this.c1)) {
				token.cargo += this.c1
				this.getChar()
			}
			if (keywords.includes(token.cargo)) {
				token.type = TokenType.KEYWORD
			}
		} else if (one_char_symbols.includes(this.c1)) {
			token.type = TokenType.SYMBOL
			let first_char = this.c1
			this.getChar() // read past the first character
			if (two_char_symbols.includes(first_char + this.c1)) {
				token.cargo += this.c1
				let second_char = this.c1
				this.getChar() // read past the second character
				if (three_char_symbols.includes(first_char + second_char + this.c1)) {
					token.cargo += this.c1
					this.getChar() // read past the third character
				}
			}
		} else {
			throw new Error(`I found a character or symbol that I do not recognize: ${this.c1}`)
		}
		return token
	}

	/**
	 * Get the next character in a token.
	 */
	getChar(): void {
		this.character = this.scanner.next()
		this.c1 = this.character.value[0].cargo
		this.c2 = (this.character.value[1] !== null) ? this.c1 + this.character.value[1].cargo : null
	}
}
