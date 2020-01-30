import Serializable from '../iface/Serializable.iface'
import {STX, ETX} from './Char.class'
import Token, {TokenNumber} from './Token.class'
import SemanticNode, {
	SemanticNodeNull,
	SemanticNodeGoal,
	SemanticNodeExpression,
	SemanticNodeConstant,
} from './SemanticNode.class'
import {Rule} from './Grammar.class'
import Production, {
	ProductionFile,
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
		return new ([...new Map<Production, typeof ParseNode>([
			[ProductionFile                     .instance, ParseNodeGoal            ],
			[ProductionExpression               .instance, ParseNodeExpression      ],
			[ProductionExpressionAdditive       .instance, ParseNodeExpressionBinary],
			[ProductionExpressionMultiplicative .instance, ParseNodeExpressionBinary],
			[ProductionExpressionExponential    .instance, ParseNodeExpressionBinary],
			[ProductionExpressionUnarySymbol    .instance, ParseNodeExpressionUnary ],
			[ProductionExpressionUnit           .instance, ParseNodeExpressionUnit  ],
		]).entries()].find(([key]) => rule.production.equals(key)) || [null, ParseNode])[1](rule, children)
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
		protected readonly children: readonly (Token|ParseNode)[],
	) {
		this.tagname = this.rule.production.displayName
		this.source = this.children.map((child) => child.source).join(' ')
		this.line_index = this.children[0].line_index
		this.col_index  = this.children[0].col_index
	}

	/**
	 * Return a Semantic Node, a node of the Semantic Tree or “decorated/abstract syntax tree”.
	 * @returns a semantic node containing this parse node’s semantics
	 */
	decorate(): SemanticNode {
		return new SemanticNode(this)
	}

	/**
	 * @implements Serializable
	 */
	serialize(...attrs: string[]): string {
		const attributes: string = ' ' + [
			!(this instanceof ParseNodeGoal) ? `line="${this.line_index + 1}"` : '',
			!(this instanceof ParseNodeGoal) ?  `col="${this.col_index  + 1}"` : '',
			`source="${
				this.source
					.replace(STX, '\u2402') /* SYMBOL FOR START OF TEXT */
					.replace(ETX, '\u2403') /* SYMBOL FOR START OF TEXT */
			}"`,
			...attrs
		].join(' ').trim()
		const contents: string = this.children.map((child) => child.serialize()).join('')
		return `<${this.tagname}${attributes}>${contents}</${this.tagname}>`
	}
}



class ParseNodeGoal extends ParseNode {
	declare children: [Token, Token] | [Token, ParseNodeExpression, Token];
	decorate(): SemanticNode {
		return (this.children.length === 2) ?
			new SemanticNodeNull(this)
		:
			new SemanticNodeGoal(this, [
				this.children[1].decorate()
			])
	}
}
class ParseNodeExpression extends ParseNode {
	declare children: [ParseNodeExpressionBinary];
	decorate(): SemanticNodeExpression {
		return this.children[0].decorate()
	}
}
class ParseNodeExpressionBinary extends ParseNode {
	declare children: [ParseNodeExpressionBinary] | [ParseNodeExpressionBinary|ParseNodeExpressionUnary, Token, ParseNodeExpressionBinary];
	decorate(): SemanticNodeExpression {
		return (this.children.length === 1) ?
			this.children[0].decorate()
		:
			new SemanticNodeExpression(this, this.children[1].source, [
				this.children[0].decorate(),
				this.children[2].decorate(),
			])
	}
}
class ParseNodeExpressionUnary extends ParseNode {
	declare children: [ParseNodeExpressionUnit] | [Token, ParseNodeExpressionUnary];
	decorate(): SemanticNode {
		return (this.children.length === 1) ?
			this.children[0].decorate()
		:
			new SemanticNodeExpression(this, this.children[0].source, [
				this.children[1].decorate(),
			])
	}
}
class ParseNodeExpressionUnit extends ParseNode {
	declare children: [TokenNumber] | [Token, ParseNodeExpression, Token];
	decorate(): SemanticNode {
		return (this.children.length === 1) ?
			new SemanticNodeConstant(this, this.children[0].value !)
		:
			this.children[1].decorate()
	}
}
