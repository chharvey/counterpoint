import Serializable from '../iface/Serializable.iface'

import {STX, ETX} from './Scanner.class'
import Token from './Token.class'
import SemanticNode from './SemanticNode.class'
import {Rule} from './Grammar.class'
import {
	ProductionGoal,
	ProductionStatement,
	ProductionDeclarationVariable,
	ProductionStatementAssignment,
	ProductionExpression,
	ProductionExpressionAdditive,
	ProductionExpressionMultiplicative,
	ProductionExpressionExponential,
	ProductionExpressionUnarySymbol,
	ProductionExpressionUnit,
	ProductionStringTemplate,
	ProductionPrimitiveLiteral,
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
		return (rule.production.equals(ProductionGoal.instance)) ?
			new ParseNodeGoal(rule, children)
		: (rule.production.equals(ProductionGoal.__0__List.instance)) ?
			new ParseNodeStatementList(rule, children)
		: (rule.production.equals(ProductionStatement.instance)) ?
			new ParseNodeStatement(rule, children)
		: (rule.production.equals(ProductionDeclarationVariable.instance)) ?
			new ParseNodeDeclarationVariable(rule, children)
		: (rule.production.equals(ProductionStatementAssignment.instance)) ?
			new ParseNodeStatementAssignment(rule, children)
		: (rule.production.equals(ProductionExpression.instance)) ?
			new ParseNodeExpression(rule, children)
		: ([
			ProductionExpressionAdditive,
			ProductionExpressionMultiplicative,
			ProductionExpressionExponential,
		].some((prodclass) => rule.production.equals(prodclass.instance))) ?
			new ParseNodeExpressionBinary(rule, children)
		: (rule.production.equals(ProductionExpressionUnarySymbol.instance)) ?
			new ParseNodeExpressionUnary(rule, children)
		: (rule.production.equals(ProductionExpressionUnit.instance)) ?
			new ParseNodeExpressionUnit(rule, children)
		: ([
			ProductionStringTemplate,
			ProductionStringTemplate.__0__List,
		].some((prodclass) => rule.production.equals(prodclass.instance))) ?
			new ParseNodeStringTemplate(rule, children)
		: (rule.production.equals(ProductionPrimitiveLiteral.instance)) ?
			new ParseNodePrimitiveLiteral(rule, children)
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
	serialize(): string {
		const attributes: string = ' ' + [
			!this.rule.production.equals(ProductionGoal.instance) ? `line="${this.line_index + 1}"` : '',
			!this.rule.production.equals(ProductionGoal.instance) ?  `col="${this.col_index  + 1}"` : '',
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
		const contents: string = this.children.map((child) => child.serialize()).join('')
		return `<${this.tagname}${attributes}>${contents}</${this.tagname}>`
	}
	/**
	 * Return a Semantic Node, a node of the Semantic Tree or “decorated/abstract syntax tree”.
	 * @returns a semantic node containing this parse node’s semantics
	 */
	decorate(): SemanticNode {
		return new SemanticNode(this, `SemanticUnknown`, this.children.map((c) =>
			(c instanceof ParseNode) ? c.decorate() : new SemanticNode(c, `SemanticToken`, [], {'syntactic-name': c.tagname})
		), {'syntactic-name': this.tagname})
	}
}
class ParseNodeGoal extends ParseNode {
	decorate(): SemanticNode {
		return (this.children.length === 2) ?
			new SemanticNode(this, 'SemanticNull')
		:
			new SemanticNode(this, 'SemanticGoal', [
				(this.children[1] as ParseNode).decorate(),
			])
	}
}
class ParseNodeStatementList extends ParseNode {
	decorate(): SemanticNode {
		return new SemanticNode(this, 'SemanticStatementList', this.children.flatMap((c) => c instanceof ParseNodeStatementList ?
			c.decorate().children
		: // c instanceof ParseNodeStatement
			[(c as ParseNode).decorate()]
		))
	}
}
class ParseNodeStatement extends ParseNode {
	decorate(): SemanticNode {
		const firstchild: ParseNode|Token = this.children[0]
		return (this.children.length === 1 && firstchild instanceof ParseNode) ?
			firstchild.decorate() :
			new SemanticNode(this, `SemanticStatement`, (this.children.length === 2) ? [
				(firstchild as ParseNode).decorate(),
			] : [], {type: 'expression'})
	}
}
class ParseNodeDeclarationVariable extends ParseNode {
	decorate(): SemanticNode {
		const is_unfixed: boolean   = this.children[1] instanceof Token && this.children[1].source === 'unfixed'
		const identifier: Token     = this.children[is_unfixed ? 2 : 1] as Token
		const expression: ParseNode = this.children[is_unfixed ? 4 : 3] as ParseNode
		return new SemanticNode(this, 'SemanticDeclaration', [
			new SemanticNode(identifier, 'SemanticAssignee', [
				new SemanticNode(identifier, 'SemanticIdentifier', [], {id: identifier.cook()}),
			], {unfixed: is_unfixed}),
			new SemanticNode(expression, 'SemanticAssigned', [
				expression.decorate(),
			]),
		], {type: 'variable'})
	}
}
class ParseNodeStatementAssignment extends ParseNode {
	decorate(): SemanticNode {
		const identifier: Token     = this.children[0] as Token
		const expression: ParseNode = this.children[2] as ParseNode
		return new SemanticNode(this, 'SemanticAssignment', [
			new SemanticNode(identifier, 'SemanticAssignee', [
				new SemanticNode(identifier, 'SemanticIdentifier', [], {id: identifier.cook()}),
			]),
			new SemanticNode(expression, 'SemanticAssigned', [
				expression.decorate(),
			]),
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
		const firstchild: ParseNode|Token = this.children[0]
		return (this.children.length === 1) ?
			(firstchild instanceof ParseNode) ? firstchild.decorate() :
				new SemanticNode(this, `SemanticIdentifier`, [], {'id': firstchild.cook()})
		:
			new SemanticNode(this, 'SemanticExpression', [
				(this.children[1] as ParseNode).decorate(),
			], {operator: [this.children[0], this.children[2]].map((c) => c.source).join('')})
	}
}
class ParseNodeStringTemplate extends ParseNode {
	decorate(): SemanticNode {
		return new SemanticNode(this, 'SemanticTemplate', this.children.flatMap((c) => c instanceof Token ?
			[new SemanticNode(c, 'SemanticConstant', [], {value: (c as Token).cook()})]
		: c instanceof ParseNodeStringTemplate ?
			c.decorate().children
		: // c instanceof ParseNodeExpression
			[c.decorate()]
		))
	}
}
class ParseNodePrimitiveLiteral extends ParseNode {
	decorate(): SemanticNode {
		return new SemanticNode(this, 'SemanticConstant', [], {value: (this.children[0] as Token).cook()})
	}
}
