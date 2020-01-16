import Serializable from '../iface/Serializable.iface'

import {STX, ETX} from './Scanner.class'
import Translator from './Translator.class'
import Token, {TokenNumber} from './Token.class'
import SemanticNode from './SemanticNode.class'
import {Rule} from './Grammar.class'
import {
	ProductionGoal,
	ProductionExpression,
	ProductionExpressionAdditive,
	ProductionExpressionMultiplicative,
	ProductionExpressionExponential,
	ProductionExpressionUnarySymbol,
	ProductionExpressionUnit,
} from './Production.class'


/**
 * A ParseNode is a node in a parse tree for a given input stream.
 * It holds:
 * - the group of child inputs ({@link Token}s and/or other ParseNodes)
 * - the line number and column index where the text code of the node starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_8.2
 */
export default class ParseNode implements Serializable {
	/**
	 * Construct a speific subtype of ParseNode depending on which production the rule belongs to.
	 *
	 * @param rule     - The Rule used to create this ParseNode.
	 * @param children - The set of child inputs that creates this ParseNode.
	 * @returns          a new ParseNode object
	 */
	static from(rule: Rule, children: readonly (Token|ParseNode)[]): ParseNode {
		return (rule.production === ProductionGoal.instance) ?
			new ParseNodeGoal(rule, children)
		: (rule.production === ProductionExpression.instance) ?
			new ParseNodeExpression(rule, children)
		: ([
			ProductionExpressionAdditive,
			ProductionExpressionMultiplicative,
			ProductionExpressionExponential,
		].some((prodclass) => rule.production === prodclass.instance)) ?
			new ParseNodeExpressionBinary(rule, children)
		: (rule.production === ProductionExpressionUnarySymbol.instance) ?
			new ParseNodeExpressionUnary(rule, children)
		: (rule.production === ProductionExpressionUnit.instance) ?
			new ParseNodeExpressionUnit(rule, children)
		:
			new ParseNode(rule, children)
	}


	/** The name of the type of this ParseNode. */
	readonly tagname: string;
	/** The concatenation of the source text of all children. */
	readonly source: string;
	/** Zero-based line number of the first token (first line is line 0). */
	readonly line_index: number;
	/** Zero-based column number of the first token (first col is col 0). */
	readonly col_index: number;
	/**
	 * Construct a new ParseNode object.
	 *
	 * @param rule     - The Rule used to create this ParseNode.
	 * @param children - The set of child inputs that creates this ParseNode.
	 */
	protected constructor(
		readonly rule: Rule,
		readonly children: readonly (Token|ParseNode)[],
	) {
		this.tagname = this.rule.production.displayName
		this.source = this.children.map((child) => child.source).join(' ')
		this.line_index = this.children[0].line_index
		this.col_index  = this.children[0].col_index
	}
	/**
	 * @implements Serializable
	 */
	serialize(trans: Translator|null = null): string {
		const attributes: string = ' ' + [
			(this.rule.production !== ProductionGoal.instance) ? `line="${this.line_index + 1}"` : '',
			(this.rule.production !== ProductionGoal.instance) ?  `col="${this.col_index  + 1}"` : '',
			`source="${this.source
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
				.replace(STX, '\u2402') /* SYMBOL FOR START OF TEXT */
				.replace(ETX, '\u2403') /* SYMBOL FOR START OF TEXT */
			}"`,
		].join(' ').trim()
		const contents: string = this.children.map((child) => child.serialize(trans)).join('')
		return `<${this.tagname}${attributes}>${contents}</${this.tagname}>`
	}
	/**
	 * Return a Semantic Node, a node of the Semantic Tree or “decorated/abstract syntax tree”.
	 * @returns a semantic node containing this parse node’s semantics
	 */
	decorate(): SemanticNode {
		return new SemanticNode(this, 'SemanticUnknown')
	}
}
class ParseNodeGoal extends ParseNode {
	decorate(): SemanticNode {
		return (this.children.length === 2) ?
			new SemanticNode(this, 'SemanticNull')
		:
			new SemanticNode(this, 'SemanticGoal', [
				(this.children[1] as ParseNode).decorate()
			])
	}
}
class ParseNodeExpression extends ParseNode {
	decorate(): SemanticNode {
		return (this.children[0] as ParseNode).decorate()
	}
}
class ParseNodeExpressionBinary extends ParseNode {
	decorate(): SemanticNode {
		return (this.children.length === 1) ?
			(this.children[0] as ParseNode).decorate()
		:
			new SemanticNode(this, 'SemanticExpression', [
				(this.children[0] as ParseNode).decorate(),
				(this.children[2] as ParseNode).decorate(),
			], {operator: this.children[1].source})
	}
}
class ParseNodeExpressionUnary extends ParseNode {
	decorate(): SemanticNode {
		return (this.children.length === 1) ?
			(this.children[0] as ParseNode).decorate()
		:
			new SemanticNode(this, 'SemanticExpression', [
				(this.children[1] as ParseNode).decorate(),
			], {operator: this.children[0].source})
	}
}
class ParseNodeExpressionUnit extends ParseNode {
	decorate(): SemanticNode {
		return (this.children.length === 1) ?
			new SemanticNode(this, 'SemanticConstant', [], {value: (this.children[0] as TokenNumber).value}) // TODO use `.cook()` in v2
		:
			new SemanticNode(this, 'SemanticExpression', [
				(this.children[1] as ParseNode).decorate(),
			], {operator: [this.children[0], this.children[2]].map((c) => c.source).join('')})
	}
}
