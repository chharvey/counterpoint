import type {KleenePlus} from '../types.d'
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
	Production,
	ParseNode,
} from '../parser/'
import * as TOKEN from './Token.class'
import * as PRODUCTION from './Production.auto'
import * as PARSENODE from './ParseNode.auto'
import * as SEMANTICNODE from './SemanticNode.class'
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
			PRODUCTION.ProductionNonterminalName        .instance,
			PRODUCTION.ProductionIdentifier__CSL        .instance,
			PRODUCTION.ProductionNonterminalRef         .instance,
			PRODUCTION.ProductionNonterminalRef__0__CSL .instance,
			PRODUCTION.ProductionConditionSet           .instance,
			PRODUCTION.ProductionConditionSet__0__CSL   .instance,
			PRODUCTION.ProductionUnit                   .instance,
			PRODUCTION.ProductionUnary                  .instance,
			PRODUCTION.ProductionItem                   .instance,
			PRODUCTION.ProductionItem__List             .instance,
			PRODUCTION.ProductionConcat                 .instance,
			PRODUCTION.ProductionAltern                 .instance,
			PRODUCTION.ProductionDefinition             .instance,
			PRODUCTION.ProductionProduction             .instance,
			PRODUCTION.ProductionGrammar                .instance,
			PRODUCTION.ProductionProduction__List       .instance,
		], PRODUCTION.ProductionGrammar.instance), new Map<Production, typeof ParseNode>([
			[PRODUCTION.ProductionNonterminalName        .instance, PARSENODE.ParseNodeNonterminalName],
			[PRODUCTION.ProductionIdentifier__CSL        .instance, PARSENODE.ParseNodeIdentifier__CSL],
			[PRODUCTION.ProductionNonterminalRef         .instance, PARSENODE.ParseNodeNonterminalRef],
			[PRODUCTION.ProductionNonterminalRef__0__CSL .instance, PARSENODE.ParseNodeNonterminalRef__0__CSL],
			[PRODUCTION.ProductionConditionSet           .instance, PARSENODE.ParseNodeConditionSet],
			[PRODUCTION.ProductionConditionSet__0__CSL   .instance, PARSENODE.ParseNodeConditionSet__0__CSL],
			[PRODUCTION.ProductionUnit                   .instance, PARSENODE.ParseNodeUnit],
			[PRODUCTION.ProductionUnary                  .instance, PARSENODE.ParseNodeUnary],
			[PRODUCTION.ProductionItem                   .instance, PARSENODE.ParseNodeItem],
			[PRODUCTION.ProductionItem__List             .instance, PARSENODE.ParseNodeItem__List],
			[PRODUCTION.ProductionConcat                 .instance, PARSENODE.ParseNodeConcat],
			[PRODUCTION.ProductionAltern                 .instance, PARSENODE.ParseNodeAltern],
			[PRODUCTION.ProductionDefinition             .instance, PARSENODE.ParseNodeDefinition],
			[PRODUCTION.ProductionProduction             .instance, PARSENODE.ParseNodeProduction],
			[PRODUCTION.ProductionGrammar                .instance, PARSENODE.ParseNodeGrammar],
			[PRODUCTION.ProductionProduction__List       .instance, PARSENODE.ParseNodeProduction__List],
		]))
	}
}



export class Decorator {
	private static readonly OPS_UN: ReadonlyMap<string, 'plus' | 'star' | 'hash' | 'opt'> = new Map<string, 'plus' | 'star' | 'hash' | 'opt'>([
		[`+`, 'plus'],
		[`*`, 'star'],
		[`#`, 'hash'],
		[`?`, 'opt'],
	])
	private static readonly OPS_BIN: ReadonlyMap<string, 'concat' | 'altern'> = new Map<string, 'concat' | 'altern'>([
		[`&`, 'concat'],
		[`|`, 'altern'],
	])
	private static readonly PARAMOPS: ReadonlyMap<string, boolean | 'inherit'> = new Map<string, boolean | 'inherit'>([
		[`+`, true],
		[`-`, false],
		[`?`, 'inherit'],
	])


	/**
	 * Return a JSON object describing an EBNF production.
	 * Similar to a node of the Semantic Tree or “decorated/abstract syntax tree”.
	 * @returns a JSON object containing the parse node’s semantics
	 */
	decorate(node: PARSENODE.ParseNodeNonterminalName):        SEMANTICNODE.SemanticNodeNonterminal;
	decorate(node: PARSENODE.ParseNodeIdentifier__CSL):        KleenePlus<SEMANTICNODE.SemanticNodeParam>;
	decorate(node: PARSENODE.ParseNodeNonterminalRef):         SEMANTICNODE.SemanticNodeRef;
	decorate(node: PARSENODE.ParseNodeNonterminalRef__0__CSL): KleenePlus<SEMANTICNODE.SemanticNodeArg>;
	decorate(node: PARSENODE.ParseNodeConditionSet):           KleenePlus<SEMANTICNODE.SemanticNodeCondition>;
	decorate(node: PARSENODE.ParseNodeConditionSet__0__CSL):   KleenePlus<SEMANTICNODE.SemanticNodeCondition>;
	decorate(node: PARSENODE.ParseNodeUnit):                   SEMANTICNODE.SemanticNodeExpr;
	decorate(node: PARSENODE.ParseNodeUnary):                  SEMANTICNODE.SemanticNodeExpr;
	decorate(node: PARSENODE.ParseNodeItem):                   SEMANTICNODE.SemanticNodeExpr;
	decorate(node: PARSENODE.ParseNodeItem__List):             SEMANTICNODE.SemanticNodeExpr;
	decorate(node: PARSENODE.ParseNodeConcat):                 SEMANTICNODE.SemanticNodeExpr;
	decorate(node: PARSENODE.ParseNodeAltern):                 SEMANTICNODE.SemanticNodeExpr;
	decorate(node: PARSENODE.ParseNodeDefinition):             SEMANTICNODE.SemanticNodeExpr;
	decorate(node: PARSENODE.ParseNodeProduction):             SEMANTICNODE.SemanticNodeProduction;
	decorate(node: PARSENODE.ParseNodeGrammar):                SEMANTICNODE.SemanticNodeGrammar;
	decorate(node: PARSENODE.ParseNodeProduction__List):       KleenePlus<SEMANTICNODE.SemanticNodeProduction>;
	decorate(node: ParseNode): SEMANTICNODE.SemanticNodeEBNF | readonly SEMANTICNODE.SemanticNodeEBNF[];
	decorate(node: ParseNode): SEMANTICNODE.SemanticNodeEBNF | readonly SEMANTICNODE.SemanticNodeEBNF[] {
		if (node instanceof PARSENODE.ParseNodeNonterminalName) {
			return new SEMANTICNODE.SemanticNodeNonterminal(
				node.children[0] as TOKEN.TokenIdentifier,
				(node.children.length === 4) ? this.decorate(node.children[2]) : [],
			)

		} else if (node instanceof PARSENODE.ParseNodeIdentifier__CSL) {
			function decorateParam(identifier: TOKEN.TokenIdentifier): SEMANTICNODE.SemanticNodeParam {
				return new SEMANTICNODE.SemanticNodeParam(identifier)
			}
			return (node.children.length === 1)
				? [
					decorateParam(node.children[0] as TOKEN.TokenIdentifier),
				]
				: [
					...this.decorate(node.children[0]),
					decorateParam(node.children[2] as TOKEN.TokenIdentifier),
				]

		} else if (node instanceof PARSENODE.ParseNodeNonterminalRef) {
			return new SEMANTICNODE.SemanticNodeRef(
				node.children[0] as TOKEN.TokenIdentifier,
				(node.children.length === 4) ? this.decorate(node.children[2]) : [],
			)

		} else if (node instanceof PARSENODE.ParseNodeNonterminalRef__0__CSL) {
			function decorateArg(name: TOKEN.TokenIdentifier, append: TOKEN.TokenPunctuator): SEMANTICNODE.SemanticNodeArg {
				return new SEMANTICNODE.SemanticNodeArg(name, Decorator.PARAMOPS.get(append.source)!)
			}
			return (node.children.length === 2)
				? [
					decorateArg(
						node.children[1] as TOKEN.TokenIdentifier,
						node.children[0] as TOKEN.TokenPunctuator,
					),
				]
				: [
					...this.decorate(node.children[0]),
					decorateArg(
						node.children[3] as TOKEN.TokenIdentifier,
						node.children[2] as TOKEN.TokenPunctuator,
					),
				]

		} else if (node instanceof PARSENODE.ParseNodeConditionSet) {
			return this.decorate(node.children[1])

		} else if (node instanceof PARSENODE.ParseNodeConditionSet__0__CSL) {
			function decorateCondition(name: TOKEN.TokenIdentifier, include: TOKEN.TokenPunctuator): SEMANTICNODE.SemanticNodeCondition {
				return new SEMANTICNODE.SemanticNodeCondition(name, Decorator.PARAMOPS.get(include.source) as boolean)
			}
			return (node.children.length === 2)
				? [
					decorateCondition(
						node.children[0] as TOKEN.TokenIdentifier,
						node.children[1] as TOKEN.TokenPunctuator,
					),
				]
				: [
					...this.decorate(node.children[0]),
					decorateCondition(
						node.children[2] as TOKEN.TokenIdentifier,
						node.children[3] as TOKEN.TokenPunctuator,
					),
				]

		} else if (node instanceof PARSENODE.ParseNodeUnit) {
			return (node.children.length === 1)
				? (node.children[0] instanceof Token)
					? new SEMANTICNODE.SemanticNodeConst(node.children[0] as TOKEN.TokenCharCode | TOKEN.TokenString | TOKEN.TokenCharClass)
					: this.decorate(node.children[0])
				: this.decorate(node.children[1])

		} else if (node instanceof PARSENODE.ParseNodeUnary) {
			let operand = this.decorate(node.children[0])
			if (node.children.length === 1) {
				return operand
			}
			operand = new SEMANTICNODE.SemanticNodeOpUn(
				node,
				Decorator.OPS_UN.get(node.children[1].source)!,
				operand,
			)
			if (node.children.length === 2) {
				return operand
			}
			operand = new SEMANTICNODE.SemanticNodeOpUn(
				node,
				'opt',
				operand,
			)
			return operand

		} else if (node instanceof PARSENODE.ParseNodeItem) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new SEMANTICNODE.SemanticNodeItem(
					node,
					this.decorate(node.children[1]),
					this.decorate(node.children[0]),
				)

		} else if (node instanceof PARSENODE.ParseNodeItem__List) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new SEMANTICNODE.SemanticNodeOpBin(
					node,
					'order',
					this.decorate(node.children[0]),
					this.decorate(node.children[1]),
				)

		} else if (
			node instanceof PARSENODE.ParseNodeConcat ||
			node instanceof PARSENODE.ParseNodeAltern
		) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new SEMANTICNODE.SemanticNodeOpBin(
					node,
					Decorator.OPS_BIN.get(node.children[1].source)!,
					this.decorate(node.children[0]) as SEMANTICNODE.SemanticNodeExpr,
					this.decorate(node.children[2]) as SEMANTICNODE.SemanticNodeExpr,
				)

		} else if (node instanceof PARSENODE.ParseNodeDefinition) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSENODE.ParseNodeProduction) {
			return new SEMANTICNODE.SemanticNodeProduction(
				node,
				this.decorate(node.children[0]),
				this.decorate((node.children.length === 4) ? node.children[2] : node.children[3]),
			)

		} else if (node instanceof PARSENODE.ParseNodeGrammar) {
			return new SEMANTICNODE.SemanticNodeGrammar(node, (node.children.length === 2) ? [] : this.decorate(node.children[1]))

		} else if (node instanceof PARSENODE.ParseNodeProduction__List) {
			return (node.children.length === 1)
				? [
					this.decorate(node.children[0]),
				]
				: [
					...this.decorate(node.children[0]),
					this.decorate(node.children[1]),
				]

		} else {
			throw new ReferenceError(`Could not find type of parse node ${ node }.`)
		}
	}
}
