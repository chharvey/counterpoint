import {STX, ETX} from './Scanner.class'
import Lexer from './Lexer.class'
import Token, {
	TokenFilebound,
	TokenWhitespace,
	TokenComment,
	TokenString,
	TokenNumber,
	TokenWord,
} from './Token.class'


/**
 * A translator prepares the tokens for the parser.
 * It performs certian operations such as
 * - computing the mathematical value of numerical constants
 * - performing escapes of escape sequences in strings
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
	* generate(): Iterator<Token> {
		while (!this.iterator_result_token.done) {
			if (this.t0 instanceof TokenFilebound) {
				this.t0.value = new Map<string, boolean>([
					[STX, true ],
					[ETX, false],
				]).get(this.t0.cargo) !
				yield this.t0
			} else if (this.t0 instanceof TokenWhitespace) {
				// we do not want to send whitespace to the parser
			} else if (this.t0 instanceof TokenComment) {
				// we do not want to send comments to the parser
			} else if (this.t0 instanceof TokenString) {
				this.t0.value = this.t0.cargo // here is where we perform character escapes
				yield this.t0
			} else if (this.t0 instanceof TokenNumber) {
				/**
				 * Compute the mathematical value of a `TokenNumber` token.
				 * ```
				 * MV(DigitSequenceDec ::= DigitSequenceDec [0-9])
				 * 	is 10 * MV(DigitSequenceDec) + MV([0-9])
				 * MV(DigitSequenceDec ::= 0) is 0
				 * MV(DigitSequenceDec ::= 1) is 1
				 * MV(DigitSequenceDec ::= 2) is 2
				 * MV(DigitSequenceDec ::= 3) is 3
				 * MV(DigitSequenceDec ::= 4) is 4
				 * MV(DigitSequenceDec ::= 5) is 5
				 * MV(DigitSequenceDec ::= 6) is 6
				 * MV(DigitSequenceDec ::= 7) is 7
				 * MV(DigitSequenceDec ::= 8) is 8
				 * MV(DigitSequenceDec ::= 9) is 9
				 * ```
				 * @param   cargo the string to compute
				 * @returns the mathematical value of the string
				 */
				const mv_dec = (cargo: string): number => { // base 10 // TODO let `base` be an instance field of `TokenNumber`
					if (cargo.length === 0) throw new Error('Cannot compute mathematical value of empty string.')
					return (cargo.length === 1) ? parseInt(cargo)
						: 10 * mv_dec(cargo.slice(0, -1)) + mv_dec(cargo[cargo.length-1])
				}
				this.t0.value = mv_dec(this.t0.cargo)
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
