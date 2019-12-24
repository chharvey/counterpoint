import Lexer from './Lexer.class'
import Token, {
	TokenWhitespace,
	TokenComment,
} from './Token.class'


/**
 * A translator prepares the tokens for the parser.
 * It performs certian operations such as
 * - removing whitespace and comment tokens
 * - stripping out compiler directives (“pragmas”) and sending them
 * 	separately to the compiler
 * - computing the mathematical values of numerical constants
 * - computing the string values, including escaping, of string constants (“cooking”)
 * - optimizing identifiers
 */
export default class Translator {
	/** The lexer returning tokens for each iteration. */
	private readonly lexer: Iterator<Token>;
	/** The result of the lexer iterator. */
	private iterator_result_token: IteratorResult<Token>;
	/** The current token. */
	private t0: Token;

	/**
	 * Construct a new Translator object.
	 * @param   source_text - the entire source text
	 */
	constructor(source_text: string) {
		this.lexer = new Lexer(source_text).generate()
		this.iterator_result_token = this.lexer.next()
		this.t0 = this.iterator_result_token.value
	}

	/**
	 * Prepare the next token for the parser.
	 * Whitespace and comment tokens are filtered out.
	 * @returns the next token
	 */
	* generate(): Iterator<Token> {
		while (!this.iterator_result_token.done) {
			if (!(this.t0 instanceof TokenWhitespace) && !(this.t0 instanceof TokenComment)) {
				yield this.t0
			}
			this.iterator_result_token = this.lexer.next()
			this.t0 = this.iterator_result_token.value
		}
	}
}
