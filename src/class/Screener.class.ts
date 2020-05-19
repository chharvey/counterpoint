import Lexer from './Lexer.class'
import Token, {
	TokenWhitespace,
	TokenWord,
	TokenWordBasic,
	TokenComment,
} from './Token.class'



/**
 * A screener prepares the tokens for the parser.
 * It performs certian operations such as
 * - removing whitespace and comment tokens
 * - stripping out compiler directives (“pragmas”) and sending them
 * 	separately to the compiler
 * - computing the mathematical values of numerical constants
 * - computing the string values, including escaping, of string constants (“cooking”)
 * - optimizing identifiers
 */
export default class Screener {
	/** The lexer returning tokens for each iteration. */
	private readonly lexer: IterableIterator<Token>;
	/** The result of the lexer iterator. */
	private iterator_result_token: IteratorResult<Token, void>;
	/** The current token. */
	private t0: Token|void;
	/** A set of all unique identifiers in the program. */
	private _ids: Set<string> = new Set()

	/**
	 * Construct a new Screener object.
	 * @param   source - the entire source text
	 */
	constructor(source: string) {
		this.lexer = new Lexer(source).generate()
		this.iterator_result_token = this.lexer.next()
		this.t0 = this.iterator_result_token.value
	}

	/**
	 * Prepare the next token for the parser.
	 * Whitespace and comment tokens are filtered out.
	 * @returns the next token
	 */
	* generate(): IterableIterator<Token> {
		while (!this.iterator_result_token.done) {
			if (!(this.t0 instanceof TokenWhitespace) && !(this.t0 instanceof TokenComment)) {
				if (this.t0 instanceof TokenWord) {
					if (!this.t0.isIdentifier) {
						const value: number = [...TokenWordBasic.KEYWORDS]
							.flatMap(([_, reserved]) => reserved)
							.indexOf(this.t0.source)
						if (value < 0) throw new Error('A word token was not flagged as an identifier but was not found among the reserved keywords.')
						this.t0.setValue(BigInt(value))
					} else {
						this._ids.add(this.t0.source)
						this.t0.setValue(BigInt([...this._ids].indexOf(this.t0.source)) + 128n) // bypass all the reserved keywords
					}
				}
				if (this.t0 instanceof Token) {
					yield this.t0
				}
			}
			this.iterator_result_token = this.lexer.next()
			this.t0 = this.iterator_result_token.value
		}
	}
}
