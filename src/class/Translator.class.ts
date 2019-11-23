import Serializable from '../iface/Serializable.iface'
import {STX, ETX} from './Scanner.class'
import Lexer, {
	Token,
	TokenWord,
} from './Lexer.class'


/**
 * A ParseLeaf is a leaf in the parse tree. It consists of only a single token
 * (a terminal in the syntactic grammar), and a cooked value.
 */
export class ParseLeaf implements Serializable {
	/**
	 * Construct a new ParseNode object.
	 * @param   token - the raw token to prepare
	 * @param   value - the cooked value of the raw text
	 */
	constructor(
		private readonly token: Token,
		private readonly value: string|number|boolean,
	) {
	}
	/**
	 * @implements Serializable
	 */
	serialize(): string {
		const tagname: string = this.token.tagname
		const attributes: string = ' ' + [
			`line="${this.token.line_index+1}"`,
			`col="${this.token.col_index+1}"`,
			`value="${(typeof this.value === 'string') ? this.value
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
			: this.value.toString()}"`,
		].join(' ').trim()
		const formatted: string = this.token.source
			.replace(STX, '\u2402') /* SYMBOL FOR START OF TEXT */
			.replace(ETX, '\u2403') /* SYMBOL FOR START OF TEXT */
		return `<${tagname}${attributes}>${formatted}</${tagname}>`
	}
}


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

	/** The running identifier count. Used as an id for identifier tokens. */
	private idcount: number /* bigint */ = 0;

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
	 * Construct and return the next token in the source text.
	 * @returns the next token, if it does not contain whitespace
	 */
	* generate(): Iterator<ParseLeaf|null> {
		while (!this.iterator_result_token.done) {
			yield (this.t0 instanceof TokenWord) ? this.t0.cook(this.idcount++) : this.t0.cook()
			this.iterator_result_token = this.lexer.next()
			this.t0 = this.iterator_result_token.value
		}
	}
}
