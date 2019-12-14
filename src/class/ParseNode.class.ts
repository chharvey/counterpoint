import Serializable from '../iface/Serializable.iface'

import {STX, ETX} from './Scanner.class'
import Token, {
	TokenSubclass,
	TokenNumber,
} from './Token.class'
import Util from './Util.class'


export type GrammarSymbol = Terminal|Nonterminal
       type Terminal      = string|TokenSubclass
       type Nonterminal   = NodeSubclass


/**
 * A ParseNode is a node in a parse tree for a given input stream.
 * It holds:
 * - the group of child inputs ({@link Token}s and/or other ParseNodes)
 * - the line number and column index where the text code of the node starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_8.2
 */
export default abstract class ParseNode implements Serializable {
	/** The set of child inputs that creates this ParseNode. */
	readonly inputs: readonly (Token|ParseNode)[];
	/** The concatenation of the source text of all children. */
	private readonly source: string;
	/** Zero-based line number of the first token (first line is line 0). */
	readonly line_index: number;
	/** Zero-based column number of the first token (first col is col 0). */
	readonly col_index: number;
	/**
	 * Construct a new ParseNode object.
	 *
	 * @param tagname  - the name of the type of this ParseNode
	 * @param children - the child Tokens and/or ParseNodes of this ParseNode
	 */
	constructor(
		private readonly tagname: string,
		children: readonly (Token|ParseNode)[],
	) {
		this.inputs = children.slice()
		this.source = children.map((child) =>
			(typeof child === 'string') ? child :
			(child instanceof Token) ? child.cargo :
			child.source
		).join(' ')
		this.line_index = children[0].line_index
		this.col_index  = children[0].col_index
	}
	/**
	 * @implements Serializable
	 */
	serialize(...attrs: string[]): string {
		const tagname: string = this.tagname
		const attributes: string = (tagname !== 'FILE') ? ' ' + [
			`line="${this.line_index+1}"`,
			`col="${this.col_index+1}"`,
			`source="${
				this.source
					.replace(STX, '\u2402') /* SYMBOL FOR START OF TEXT */
					.replace(ETX, '\u2403') /* SYMBOL FOR START OF TEXT */
			}"`,
			...attrs
		].join(' ').trim() : ''
		const contents: string = this.inputs.map((child) =>
			(typeof child === 'string') ? child : child.serialize()
		).join('')
		return `<${tagname}${attributes}>${contents}</${tagname}>`
	}
}
export interface NodeSubclass extends NewableFunction {
	readonly TAGNAME: string;
	/**
	 * A set of sequences of parse symbols (terminals and/or nonterminals) in this production.
	 */
	readonly sequences: readonly (readonly GrammarSymbol[])[];
	/**
	 * Generate a random instance of this ParseNode.
	 * @returns a well-formed sequence of strings satisfying this ParseNode class
	 */
	random(): string[];
	new (children: readonly (Token|ParseNode)[]): ParseNode;
}
export const isNodeSubclass = (it: any): it is NodeSubclass => {
	return !!it && !!it.prototype && it.prototype.__proto__ === ParseNode.prototype
}


export class NodeFile extends ParseNode {
	static readonly TAGNAME: string = 'File'
	static get sequences(): GrammarSymbol[][] {
		return [
			[STX,                 ETX],
			[STX, NodeExpression, ETX],
		]
	}
	static random(): string[] {
		return [STX, ...NodeExpression.random(), ETX]
	}
	constructor(children: readonly (Token|ParseNode)[]) {
		super(NodeFile.TAGNAME, children)
	}
}
export class NodeExpression extends ParseNode {
	static readonly TAGNAME: string = 'Expression'
	static get sequences(): GrammarSymbol[][] {
		return [
			[NodeExpressionAdditive],
		]
	}
	static random(): string[] {
		return NodeExpressionAdditive.random()
	}
	constructor(children: readonly (Token|ParseNode)[]) {
		super(NodeExpression.TAGNAME, children)
	}
}
export class NodeExpressionAdditive extends ParseNode {
	static readonly TAGNAME: string = 'ExpressionAdditive'
	static get sequences(): GrammarSymbol[][] {
		return [
			[                             NodeExpressionMultiplicative],
			[NodeExpressionAdditive, '+', NodeExpressionMultiplicative],
			[NodeExpressionAdditive, '-', NodeExpressionMultiplicative],
		]
	}
	static random(): string[] {
		return [
			...(Util.randomBool() ? [] : [...NodeExpressionAdditive.random(), Util.arrayRandom(['+','-'])]),
			...NodeExpressionMultiplicative.random(),
		]
	}
	constructor(children: readonly (Token|ParseNode)[]) {
		super(NodeExpressionAdditive.TAGNAME, children)
	}
}
export class NodeExpressionMultiplicative extends ParseNode {
	static readonly TAGNAME: string = 'ExpressionMultiplicative'
	static get sequences(): GrammarSymbol[][] {
		return [
			[                                   NodeExpressionExponential],
			[NodeExpressionMultiplicative, '*', NodeExpressionExponential],
			[NodeExpressionMultiplicative, '/', NodeExpressionExponential],
		]
	}
	static random(): string[] {
		return [
			...(Util.randomBool() ? [] : [...NodeExpressionMultiplicative.random(), Util.arrayRandom(['*','/'])]),
			...NodeExpressionExponential.random(),
		]
	}
	constructor(children: readonly (Token|ParseNode)[]) {
		super(NodeExpressionMultiplicative.TAGNAME, children)
	}
}
export class NodeExpressionExponential extends ParseNode {
	static readonly TAGNAME: string = 'ExpressionExponential'
	static get sequences(): GrammarSymbol[][] {
		return [
			[NodeExpressionUnarySymbol                                ],
			[NodeExpressionUnarySymbol, '^', NodeExpressionExponential],
		]
	}
	static random(): string[] {
		return [
			...NodeExpressionUnarySymbol.random(),
			...(Util.randomBool() ? [] : ['^', ...NodeExpressionExponential.random()]),
		]
	}
	constructor(children: readonly (Token|ParseNode)[]) {
		super(NodeExpressionExponential.TAGNAME, children)
	}
}
export class NodeExpressionUnarySymbol extends ParseNode {
	static readonly TAGNAME: string = 'ExpressionUnarySymbol'
	static get sequences(): GrammarSymbol[][] {
		return [
			[NodeExpressionUnit],
			['+', NodeExpressionUnarySymbol],
			['-', NodeExpressionUnarySymbol],
		]
	}
	static random(): string[] {
		return Util.randomBool() ?
			NodeExpressionUnit.random() :
			[Util.arrayRandom(['+','-']), ...NodeExpressionUnarySymbol.random()]
	}
	constructor(children: readonly (Token|ParseNode)[]) {
		super(NodeExpressionUnarySymbol.TAGNAME, children)
	}
}
export class NodeExpressionUnit extends ParseNode {
	static readonly TAGNAME: string = 'ExpressionUnit'
	static get sequences(): GrammarSymbol[][] {
		return [
			[TokenNumber],
			['(', NodeExpression, ')'],
		]
	}
	static random(): string[] {
		return Util.randomBool() ?
			[TokenNumber.random()] :
			['(', ...NodeExpression.random(), ')']
	}
	constructor(children: readonly (Token|ParseNode)[]) {
		super(NodeExpressionUnit.TAGNAME, children)
	}
}
