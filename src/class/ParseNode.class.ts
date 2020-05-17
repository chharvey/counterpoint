import Util from './Util.class'
import type Serializable from '../iface/Serializable.iface'
import {STX, ETX} from './Char.class'
import Token, {
	TokenFilebound,
	TokenString,
	TokenTemplate,
	TokenNumber,
	TokenWord,
	TokenPunctuator,
} from './Token.class'
import SemanticNode, {
	SemanticNodeNull,
	SemanticNodeGoal,
	SemanticNodeStatementList,
	SemanticNodeDeclaration,
	SemanticNodeAssignment,
	SemanticNodeAssignee,
	SemanticNodeAssigned,
	SemanticNodeStatementExpression,
	SemanticNodeStatementEmpty,
	SemanticNodeExpression,
	SemanticNodeTemplate,
	SemanticNodeIdentifier,
	SemanticNodeConstant,
	SemanticExpressionType,
	SemanticStatementType,
	Operator,
} from './SemanticNode.class'
import type {Rule} from './Grammar.class'
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
		])].find(([key]) => rule.production.equals(key)) || [null, ParseNode])[1](rule, children)
	}


	/** The name of the type of this ParseNode. */
	readonly tagname: string;
	/** The concatenation of the source text of all children. */
	readonly source: string;
	/** The index of the first token in source text. */
	readonly source_index: number;
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
		this.tagname      = this.rule.production.displayName
		this.source       = this.children.map((child) => child.source).join(' ')
		this.source_index = this.children[0].source_index
		this.line_index   = this.children[0].line_index
		this.col_index    = this.children[0].col_index
	}

	/**
	 * Return a Semantic Node, a node of the Semantic Tree or “decorated/abstract syntax tree”.
	 * @returns a semantic node containing this parse node’s semantics
	 */
	decorate(): SemanticNode {
		return new SemanticNode(this, {'syntactic-name': this.tagname}, this.children.map((c) =>
			(c instanceof ParseNode) ? c.decorate() : new SemanticNode(c, {'syntactic-name': c.tagname})
		))
	}

	/**
	 * @implements Serializable
	 */
	serialize(): string {
		const attributes: Map<string, string> = new Map<string, string>()
		if (!(this instanceof ParseNodeGoal)) {
			attributes.set('line', `${this.line_index + 1}`)
			attributes.set('col' , `${this.col_index  + 1}`)
		}
		attributes.set('source', this.source
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
		)
		const contents: string = this.children.map((child) => child.serialize()).join('')
		return `<${this.tagname} ${Util.stringifyAttributes(attributes)}>${contents}</${this.tagname}>`
	}
}



export class ParseNodeGoal extends ParseNode {
	declare children:
		readonly [TokenFilebound,                         TokenFilebound] |
		readonly [TokenFilebound, ParseNodeStatementList, TokenFilebound];
	decorate(): SemanticNodeNull|SemanticNodeGoal {
		return (this.children.length === 2) ?
			new SemanticNodeNull(this)
		:
			new SemanticNodeGoal(this, [
				this.children[1].decorate()
			])
	}
}
export class ParseNodeStatementList extends ParseNode {
	declare children:
		readonly [                        ParseNodeStatement] |
		readonly [ParseNodeStatementList, ParseNodeStatement];
	decorate(): SemanticNodeStatementList {
		return new SemanticNodeStatementList(this, this.children.length === 1 ?
			[this.children[0].decorate()]
		: [
			...this.children[0].decorate().children,
			this.children[1].decorate()
		])
	}
}
export class ParseNodeStatement extends ParseNode {
	declare children:
		readonly [ParseNodeDeclarationVariable]         |
		readonly [ParseNodeStatementAssignment]         |
		readonly [ParseNodeExpression, TokenPunctuator] |
		readonly [TokenPunctuator];
	decorate(): SemanticStatementType {
		return (this.children.length === 1 && this.children[0] instanceof ParseNode)
			? this.children[0].decorate()
			: (this.children.length === 2)
				? new SemanticNodeStatementExpression(this, [
					this.children[0].decorate(),
				])
				: new SemanticNodeStatementEmpty(this)
	}
}
export class ParseNodeDeclarationVariable extends ParseNode {
	declare children:
		readonly [TokenWord, TokenWord,            Token, ParseNodeExpression, Token] |
		readonly [TokenWord, TokenWord, TokenWord, Token, ParseNodeExpression, Token];
	decorate(): SemanticNodeDeclaration {
		const is_unfixed: boolean             = this.children[1].source === 'unfixed'
		const identifier: TokenWord           = this.children[is_unfixed ? 2 : 1] as TokenWord
		const expression: ParseNodeExpression = this.children[is_unfixed ? 4 : 3] as ParseNodeExpression
		return new SemanticNodeDeclaration(this, 'variable', is_unfixed, [
			new SemanticNodeAssignee(identifier, [
				new SemanticNodeIdentifier(identifier, identifier.cook()),
			]),
			new SemanticNodeAssigned(expression, [
				expression.decorate(),
			]),
		])
	}
}
export class ParseNodeStatementAssignment extends ParseNode {
	declare children:
		readonly [TokenWord, Token, ParseNodeExpression, Token];
	decorate(): SemanticNodeAssignment {
		const identifier: TokenWord           = this.children[0]
		const expression: ParseNodeExpression = this.children[2]
		return new SemanticNodeAssignment(this, [
			new SemanticNodeAssignee(identifier, [
				new SemanticNodeIdentifier(identifier, identifier.cook()),
			]),
			new SemanticNodeAssigned(expression, [
				expression.decorate(),
			]),
		])
	}
}
export class ParseNodeExpression extends ParseNode {
	declare children:
		readonly [ParseNodeExpressionBinary];
	decorate(): SemanticExpressionType {
		return this.children[0].decorate()
	}
}
export class ParseNodeExpressionBinary extends ParseNode {
	private static OPERATORS: ReadonlyMap<string, Operator> = new Map<string, Operator>([
		['+', Operator.ADD],
		['-', Operator.SUB],
		['*', Operator.MUL],
		['/', Operator.DIV],
		['^', Operator.EXP],
	])
	declare children:
		readonly [ParseNodeExpressionUnary|ParseNodeExpressionBinary] |
		readonly [ParseNodeExpressionUnary|ParseNodeExpressionBinary, TokenPunctuator, ParseNodeExpressionBinary];
	decorate(): SemanticExpressionType {
		return (this.children.length === 1) ?
			this.children[0].decorate()
		:
			(this.children[1].source === '-') ? // `a - b` is syntax sugar for `a + -(b)`
				new SemanticNodeExpression(this, Operator.ADD, [
					this.children[0].decorate(),
					new SemanticNodeExpression(this.children[2], Operator.NEG, [
						this.children[2].decorate(),
					]),
				])
			:
				new SemanticNodeExpression(this, ParseNodeExpressionBinary.OPERATORS.get(this.children[1].source) !, [
					this.children[0].decorate(),
					this.children[2].decorate(),
				])
	}
}
export class ParseNodeExpressionUnary extends ParseNode {
	private static OPERATORS: ReadonlyMap<string, Operator> = new Map<string, Operator>([
		['+', Operator.AFF],
		['-', Operator.NEG],
	])
	declare children:
		readonly [ParseNodeExpressionUnit] |
		readonly [TokenPunctuator, ParseNodeExpressionUnary];
	decorate(): SemanticExpressionType {
		return (this.children.length === 1) ?
			this.children[0].decorate()
		:
			(this.children[0].source === '+') ? // `+a` is a no-op
				this.children[1].decorate()
			:
				new SemanticNodeExpression(this, ParseNodeExpressionUnary.OPERATORS.get(this.children[0].source) !, [
					this.children[1].decorate(),
				])
	}
}
export class ParseNodeExpressionUnit extends ParseNode {
	declare children:
		[TokenWord] |
		[ParseNodePrimitiveLiteral] |
		[ParseNodeStringTemplate] |
		[TokenPunctuator, ParseNodeExpression, TokenPunctuator];
	decorate(): SemanticExpressionType {
		return (this.children.length === 1) ?
			(this.children[0] instanceof ParseNode) ? this.children[0].decorate() :
				new SemanticNodeIdentifier(this.children[0], this.children[0].cook())
		:
			this.children[1].decorate()
	}
}
export class ParseNodeStringTemplate extends ParseNode {
	declare children:
		readonly (TokenTemplate|ParseNodeExpression|ParseNodeStringTemplate)[];
	decorate(): SemanticNodeTemplate {
		return new SemanticNodeTemplate(this, this.children.flatMap((c) => c instanceof Token ?
			[new SemanticNodeConstant(c, c.cook())]
		: c instanceof ParseNodeStringTemplate ?
			c.decorate().children
		:
			[c.decorate()]
		))
	}
}
export class ParseNodePrimitiveLiteral extends ParseNode {
	declare children:
		readonly [TokenString|TokenNumber];
	decorate(): SemanticNodeConstant {
		return new SemanticNodeConstant(this.children[0], this.children[0].cook())
	}
}
