import Serializable from '../iface/Serializable.iface'

import {STX, ETX} from './Scanner.class'
import Token, {TokenNumber} from './Token.class'
import SemanticNode, {
	SemanticNodeNull,
	SemanticNodeGoal,
	SemanticNodeExpression,
	SemanticNodeConstant,
} from './SemanticNode.class'
import {Rule} from './Grammar.class'
import Production, {
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
		return new ([...new Map<Production, typeof ParseNode>([
			[ProductionGoal                     .instance, ParseNodeGoal               ],
			[ProductionGoal.__0__List           .instance, ParseNodeStatementList      ],
			[ProductionStatement                .instance, ParseNodeStatement          ],
			[ProductionDeclarationVariable      .instance, ParseNodeDeclarationVariable],
			[ProductionStatementAssignment      .instance, ParseNodeStatementAssignment],
			[ProductionExpression               .instance, ParseNodeExpression         ],
			[ProductionExpressionAdditive       .instance, ParseNodeExpressionBinary   ],
			[ProductionExpressionMultiplicative .instance, ParseNodeExpressionBinary   ],
			[ProductionExpressionExponential    .instance, ParseNodeExpressionBinary   ],
			[ProductionExpressionUnarySymbol    .instance, ParseNodeExpressionUnary    ],
			[ProductionExpressionUnit           .instance, ParseNodeExpressionUnit     ],
			[ProductionStringTemplate           .instance, ParseNodeStringTemplate     ],
			[ProductionStringTemplate.__0__List .instance, ParseNodeStringTemplate     ],
			[ProductionPrimitiveLiteral         .instance, ParseNodePrimitiveLiteral   ],
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
		return new SemanticNode('Unknown', this, {'syntactic-name': this.tagname}, this.children.map((c) =>
			(c instanceof ParseNode) ? c.decorate() : new SemanticNode(`SemanticToken`, c, {'syntactic-name': c.tagname})
		))
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
class ParseNodeStatementList extends ParseNode {
	decorate(): SemanticNode {
		return new SemanticNode('StatementList', this, {}, this.children.flatMap((c) => c instanceof ParseNodeStatementList ?
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
			new SemanticNode('Statement', this, {type: 'expression'}, (this.children.length === 2) ? [
				(firstchild as ParseNode).decorate(),
			] : [])
	}
}
class ParseNodeDeclarationVariable extends ParseNode {
	decorate(): SemanticNode {
		const is_unfixed: boolean   = this.children[1] instanceof Token && this.children[1].source === 'unfixed'
		const identifier: Token     = this.children[is_unfixed ? 2 : 1] as Token
		const expression: ParseNode = this.children[is_unfixed ? 4 : 3] as ParseNode
		return new SemanticNode('Declaration', this, {type: 'variable'}, [
			new SemanticNode('Assignee', identifier, {unfixed: is_unfixed}, [
				new SemanticNode('Identifier', identifier, {id: identifier.cook()}),
			]),
			new SemanticNode('Assigned', expression, {}, [
				expression.decorate(),
			]),
		])
	}
}
class ParseNodeStatementAssignment extends ParseNode {
	decorate(): SemanticNode {
		const identifier: Token     = this.children[0] as Token
		const expression: ParseNode = this.children[2] as ParseNode
		return new SemanticNode('Assignment', this, {}, [
			new SemanticNode('Assignee', identifier, {}, [
				new SemanticNode('Identifier', identifier, {id: identifier.cook()}),
			]),
			new SemanticNode('Assigned', expression, {}, [
				expression.decorate(),
			]),
		])
	}
}
class ParseNodeExpression extends ParseNode {
	declare children: [ParseNodeExpressionBinary];
	decorate(): SemanticNode {
		return this.children[0].decorate()
	}
}
class ParseNodeExpressionBinary extends ParseNode {
	declare children: [ParseNodeExpressionBinary] | [ParseNodeExpressionBinary, Token, ParseNodeExpressionBinary];
	decorate(): SemanticNode {
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
		const firstchild: ParseNode|Token = this.children[0]
		return (this.children.length === 1) ?
			(firstchild instanceof ParseNode) ? firstchild.decorate() :
				new SemanticNode('Identifier', this, {'id': firstchild.cook()})
		:
			this.children[1].decorate()
	}
}
class ParseNodeStringTemplate extends ParseNode {
	decorate(): SemanticNode {
		return new SemanticNode('Template', this, {}, this.children.flatMap((c) => c instanceof Token ?
			[new SemanticNode('Constant', c, {value: (c as Token).cook()})]
		: c instanceof ParseNodeStringTemplate ?
			c.decorate().children
		: // c instanceof ParseNodeExpression
			[c.decorate()]
		))
	}
}
class ParseNodePrimitiveLiteral extends ParseNode {
	decorate(): SemanticNode {
		return new SemanticNode('Constant', this, {value: (this.children[0] as Token).cook()})
	}
}
