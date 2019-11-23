import {STX, ETX} from './Scanner.class'
import Lexer, {
	Token,
	TokenFilebound,
	TokenWhitespace,
	TokenComment,
	TokenString,
	TokenNumber,
	TokenWord,
} from './Lexer.class'


/**
 * A translator prepares the tokens for the parser.
 * It performs certian operations such as
 * - computing the mathematical value of numerical constants
 * - performing escapes of escape sequences in strings (a.k.a “cooking”)
 * - optimizing identifiers
 */
export default class Translator {
	/** The lexer returning tokens for each iteration. */
	private readonly lexer: Iterator<Token>;
	/** The result of the lexer iterator. */
	private iterator_result_token: IteratorResult<Token>;

	/** The current token. */
	private t0: Token;

	/** The running identifier count. Used as an id for identifier tokens. */
	private idcount: number /* bigint */ = 0;

	/**
	 * Construct a new Translator object.
	 * @param   source_text - the entire source text
	 */
	constructor(
		private readonly source_text: string,
	) {
		this.lexer = new Lexer(this.source_text).generate()
		this.iterator_result_token = this.lexer.next()
		this.t0 = this.iterator_result_token.value
	}

	/**
	 * Construct and return the next token in the source text.
	 * @returns the next token, if it does not contain whitespace
	 */
	* generate(): Iterator<Token|null> {
		while (!this.iterator_result_token.done) {
			if (this.t0 instanceof TokenFilebound) {
				this.t0.value = new Map<string, boolean>([
					[STX, true ],
					[ETX, false],
				]).get(this.t0.cargo) !
				yield this.t0
			} else if (this.t0 instanceof TokenWhitespace) {
				yield null // we do not want to send whitespace to the parser
			} else if (this.t0 instanceof TokenComment) {
				yield null // we do not want to send comments to the parser
			} else if (this.t0 instanceof TokenString) {
				this.t0.value = String.fromCodePoint(...this.t0.codePoints)
				yield this.t0
			} else if (this.t0 instanceof TokenNumber) {
				this.t0.value = TokenNumber.mv(this.t0.cargo, 10)
				yield this.t0
			} else if (this.t0 instanceof TokenWord) {
				this.t0.id = this.idcount++;
				yield this.t0
			} else {
				yield this.t0
			}
			this.iterator_result_token = this.lexer.next()
			this.t0 = this.iterator_result_token.value
		}
	}
}
