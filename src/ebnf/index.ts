import {
	Scanner,
	Lexer,
	Screener,
	Char,
	Token,
	TokenFilebound,
	TokenWhitespace,
	TokenComment,
} from '../lexer/'
import {
	Parser,
	Grammar,
	Rule,
	ParseNode,
} from '../parser/'
import type {SemanticNode} from '../validator/'
import * as TOKEN from './Token.class'
import * as PRODUCTION from './Production.auto'
import {
	LexError01,
} from '../error/LexError.class'



export class LexerEBNF extends Lexer {
	constructor (source: string) {
		super(new Scanner(source).generate())
	}
	* generate(): Generator<Token> {
		while (!this.isDone) {
			let token: Token;
			if (Char.inc(TokenFilebound.CHARS, this.c0)) {
				token = new TokenFilebound(this)

			} else if (Char.inc(TokenWhitespace.CHARS, this.c0)) {
				token = new TokenWhitespace(this)

			} else if (Char.inc(TOKEN.TokenPunctuator.PUNCTUATORS_4, this.c0, this.c1, this.c2, this.c3)) {
				token = new TOKEN.TokenPunctuator(this, 4n)
			} else if (Char.inc(TOKEN.TokenPunctuator.PUNCTUATORS_3, this.c0, this.c1, this.c2)) {
				token = new TOKEN.TokenPunctuator(this, 3n)
			} else if (Char.inc(TOKEN.TokenPunctuator.PUNCTUATORS_2, this.c0, this.c1)) {
				token = new TOKEN.TokenPunctuator(this, 2n)
			} else if (Char.inc(TOKEN.TokenPunctuator.PUNCTUATORS_1, this.c0)) {
				if (Char.eq(TOKEN.TokenCharCode.START, this.c0, this.c1)) {
					/* we found a char code */
					token = new TOKEN.TokenCharCode(this)
				} else {
					/* we found a Kleene hash or another punctuator */
					token = new TOKEN.TokenPunctuator(this)
				}

			} else if (TOKEN.TokenIdentifier.START.test(this.c0.source)) {
				token = new TOKEN.TokenIdentifier(this)

			} else if (Char.eq(TOKEN.TokenString.DELIM, this.c0)) {
				token = new TOKEN.TokenString(this)

			} else if (Char.eq(TOKEN.TokenCharClass.DELIM_START, this.c0)) {
				token = new TOKEN.TokenCharClass(this)

			} else if (Char.eq(TOKEN.TokenCommentEBNF.DELIM_START, this.c0, this.c1)) {
				token = new TOKEN.TokenCommentEBNF(this)

			} else {
				throw new LexError01(this.c0)
			}
			yield token
		}
	}
}



export class ScreenerEBNF extends Screener {
	constructor (source: string) {
		super(new LexerEBNF(source).generate())
	}
	* generate(): Generator<Token> {
		while (!this.isDone) {
			if (!(this.t0 instanceof TokenWhitespace) && !(this.t0 instanceof TokenComment)) {
				yield this.t0
			}
			this.advance()
		}
	}
}



export class ParserEBNF extends Parser {
	constructor (source: string) {
		super(new ScreenerEBNF(source).generate(), new Grammar([
			PRODUCTION.ProductionNonterminalDefinition        .instance,
			PRODUCTION.ProductionIdentifier__CSL              .instance,
			PRODUCTION.ProductionNonterminalReference         .instance,
			PRODUCTION.ProductionNonterminalReference__0__CSL .instance,
			PRODUCTION.ProductionCondition                    .instance,
			PRODUCTION.ProductionCondition__0__CSL            .instance,
			PRODUCTION.ProductionUnit                         .instance,
			PRODUCTION.ProductionUnary                        .instance,
			PRODUCTION.ProductionItem                         .instance,
			PRODUCTION.ProductionItem__List                   .instance,
			PRODUCTION.ProductionSequence                     .instance,
			PRODUCTION.ProductionChoice                       .instance,
			PRODUCTION.ProductionProduction                   .instance,
			PRODUCTION.ProductionGrammar                      .instance,
			PRODUCTION.ProductionProduction__List             .instance,
		], PRODUCTION.ProductionGrammar.instance))
	}
	protected makeParseNode(rule: Rule, children: readonly (Token | ParseNode)[]): ParseNode {
		return new (class extends ParseNode {
			decorate(): SemanticNode {
				throw new Error('TODO')
			}
		})(rule, children)
	}
}
