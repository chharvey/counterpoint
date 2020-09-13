import Util from '../class/Util.class'
import Dev from '../class/Dev.class'
import type Serializable from '../iface/Serializable.iface'
import Operator, {
	ValidTypeOperator,
	ValidOperatorUnary,
	ValidOperatorArithmetic,
	ValidOperatorComparative,
	ValidOperatorEquality,
	ValidOperatorLogical,
} from '../enum/Operator.enum'
import {
	Punctuator,
	Keyword,
	Token,
	TokenFilebound,
	TokenPunctuator,
	TokenKeyword,
	TokenIdentifier,
	TokenNumber,
	TokenString,
	TokenTemplate,
} from '../lexer/'
import {
	SemanticNode,
	SemanticNodeType,
	SemanticNodeTypeConstant,
	SemanticNodeTypeOperation,
	SemanticNodeExpression,
	SemanticNodeConstant,
	SemanticNodeIdentifier,
	SemanticNodeTemplate,
	SemanticNodeOperationUnary,
	SemanticNodeOperationBinaryArithmetic,
	SemanticNodeOperationBinaryComparative,
	SemanticNodeOperationBinaryEquality,
	SemanticNodeOperationBinaryLogical,
	SemanticNodeOperationTernary,
	SemanticNodeDeclarationVariable,
	SemanticNodeAssignment,
	SemanticNodeAssignee,
	SemanticNodeAssigned,
	SemanticStatementType,
	SemanticNodeStatementExpression,
	SemanticNodeGoal,
} from '../validator/'
import type Rule from './Rule.class'
import {
	ProductionPrimitiveLiteral,
	ProductionTypeKeyword,
	ProductionTypeUnit,
	ProductionTypeUnarySymbol,
	ProductionTypeIntersection,
	ProductionTypeUnion,
	ProductionType,
	ProductionStringTemplate,
	ProductionExpressionUnit,
	ProductionExpressionUnarySymbol,
	ProductionExpressionExponential,
	ProductionExpressionMultiplicative,
	ProductionExpressionAdditive,
	ProductionExpressionComparative,
	ProductionExpressionEquality,
	ProductionExpressionConjunctive,
	ProductionExpressionDisjunctive,
	ProductionExpressionConditional,
	ProductionExpression,
	ProductionDeclarationVariable,
	ProductionStatementAssignment,
	ProductionStatement,
	ProductionGoal,
} from './Production.class'



/**
 * A ParseNode is a node in a parse tree for a given input stream.
 * It holds:
 * - the group of child inputs ({@link Token}s and/or other ParseNodes)
 * - the line number and column index where the text code of the node starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_8.2
 */
export default abstract class ParseNode implements Serializable {
	/**
	 * Construct a speific subtype of ParseNode depending on which production the rule belongs to.
	 *
	 * @param rule     - The Rule used to create this ParseNode.
	 * @param children - The set of child inputs that creates this ParseNode.
	 * @returns          a new ParseNode object
	 */
	static from(rule: Rule, children: readonly (Token | ParseNode)[]): ParseNode {
		// NOTE: Need to use a chained if-else instead of a Map because cannot create instance of abstract class (`typeof ParseNode`).
		return (
			(                                   rule.production.equals(ProductionPrimitiveLiteral         .instance)) ? new ParseNodePrimitiveLiteral        (rule, children) :
			(Dev.supports('typingExplicit')  && rule.production.equals(ProductionTypeKeyword              .instance)) ? new ParseNodeTypeKeyword             (rule, children) :
			(Dev.supports('typingExplicit')  && rule.production.equals(ProductionTypeUnit                 .instance)) ? new ParseNodeTypeUnit                (rule, children) :
			(Dev.supports('typingExplicit')  && rule.production.equals(ProductionTypeUnarySymbol          .instance)) ? new ParseNodeTypeUnary               (rule, children) :
			(Dev.supports('typingExplicit')  && rule.production.equals(ProductionTypeIntersection         .instance)) ? new ParseNodeTypeBinary              (rule, children) :
			(Dev.supports('typingExplicit')  && rule.production.equals(ProductionTypeUnion                .instance)) ? new ParseNodeTypeBinary              (rule, children) :
			(Dev.supports('typingExplicit')  && rule.production.equals(ProductionType                     .instance)) ? new ParseNodeType                    (rule, children) :
			(Dev.supports('literalTemplate') && rule.production.equals(ProductionStringTemplate           .instance)) ? new ParseNodeStringTemplate          (rule, children) :
			(Dev.supports('literalTemplate') && rule.production.equals(ProductionStringTemplate.__0__List .instance)) ? new ParseNodeStringTemplate__0__List (rule, children) :
			(                                   rule.production.equals(ProductionExpressionUnit           .instance)) ? new ParseNodeExpressionUnit          (rule, children) :
			(                                   rule.production.equals(ProductionExpressionUnarySymbol    .instance)) ? new ParseNodeExpressionUnary         (rule, children) :
			(                                   rule.production.equals(ProductionExpressionExponential    .instance)) ? new ParseNodeExpressionBinary        (rule, children) :
			(                                   rule.production.equals(ProductionExpressionMultiplicative .instance)) ? new ParseNodeExpressionBinary        (rule, children) :
			(                                   rule.production.equals(ProductionExpressionAdditive       .instance)) ? new ParseNodeExpressionBinary        (rule, children) :
			(                                   rule.production.equals(ProductionExpressionComparative    .instance)) ? new ParseNodeExpressionBinary        (rule, children) :
			(                                   rule.production.equals(ProductionExpressionEquality       .instance)) ? new ParseNodeExpressionBinary        (rule, children) :
			(                                   rule.production.equals(ProductionExpressionConjunctive    .instance)) ? new ParseNodeExpressionBinary        (rule, children) :
			(                                   rule.production.equals(ProductionExpressionDisjunctive    .instance)) ? new ParseNodeExpressionBinary        (rule, children) :
			(                                   rule.production.equals(ProductionExpressionConditional    .instance)) ? new ParseNodeExpressionConditional   (rule, children) :
			(                                   rule.production.equals(ProductionExpression               .instance)) ? new ParseNodeExpression              (rule, children) :
			(Dev.supports('variables')       && rule.production.equals(ProductionDeclarationVariable      .instance)) ? new ParseNodeDeclarationVariable     (rule, children) :
			(Dev.supports('variables')       && rule.production.equals(ProductionStatementAssignment      .instance)) ? new ParseNodeStatementAssignment     (rule, children) :
			(                                   rule.production.equals(ProductionStatement                .instance)) ? new ParseNodeStatement               (rule, children) :
			(                                   rule.production.equals(ProductionGoal                     .instance)) ? new ParseNodeGoal                    (rule, children) :
			(                                   rule.production.equals(ProductionGoal.__0__List           .instance)) ? new ParseNodeGoal__0__List           (rule, children) :
			(() => { throw new Error(`The given rule \`${ rule.toString() }\` does not match any known grammar productions.`) })()
		)
	}


	/** @implements Serializable */
	readonly tagname: string = this.rule.production.displayName
	/** @implements Serializable */
	readonly source: string = this.children.map((child) => child.source).join(' ')
	/** @implements Serializable */
	readonly source_index: number = this.children[0].source_index
	/** @implements Serializable */
	readonly line_index: number = this.children[0].line_index
	/** @implements Serializable */
	readonly col_index: number = this.children[0].col_index

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
	}

	/**
	 * Return a Semantic Node, a node of the Semantic Tree or “decorated/abstract syntax tree”.
	 * @returns a semantic node containing this parse node’s semantics
	 */
	abstract decorate(): SemanticNode | SemanticNode[];

	/**
	 * @implements Serializable
	 */
	serialize(): string {
		const attributes: Map<string, string> = new Map<string, string>()
		if (!(this instanceof ParseNodeGoal)) {
			attributes.set('line', `${this.line_index + 1}`)
			attributes.set('col' , `${this.col_index  + 1}`)
		}
		attributes.set('source', this.source)
		const contents: string = this.children.map((child) => child.serialize()).join('')
		return `<${this.tagname} ${Util.stringifyAttributes(attributes)}>${contents}</${this.tagname}>`
	}
}



export class ParseNodePrimitiveLiteral extends ParseNode {
	declare children:
		| readonly [TokenKeyword]
		| readonly [TokenNumber]
		| readonly [TokenString] // Dev.supports('literalString')
	;
	decorate(): SemanticNodeConstant {
		return new SemanticNodeConstant(this.children[0])
	}
}
export class ParseNodeTypeKeyword extends ParseNode {
	declare children:
		| readonly [TokenKeyword]
	decorate(): SemanticNodeTypeConstant {
		return new SemanticNodeTypeConstant(this.children[0])
	}
}
export class ParseNodeTypeUnit extends ParseNode {
	declare children:
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeTypeKeyword]
		| readonly [TokenPunctuator, ParseNodeType, TokenPunctuator]
	decorate(): SemanticNodeType {
		return (this.children.length === 1)
			? (this.children[0] instanceof ParseNodePrimitiveLiteral)
				? new SemanticNodeTypeConstant(this.children[0].children[0])
				: this.children[0].decorate()
			: this.children[1].decorate()
	}
}
export class ParseNodeTypeUnary extends ParseNode {
	private static readonly OPERATORS: Map<Punctuator, ValidTypeOperator> = new Map<Punctuator, ValidTypeOperator>([
		[Punctuator.ORNULL, Operator.ORNULL],
	])
	declare children:
		| readonly [ParseNodeTypeUnit]
		| readonly [ParseNodeTypeUnary, TokenPunctuator]
	decorate(): SemanticNodeType {
		return (this.children.length === 1)
			? this.children[0].decorate()
			: new SemanticNodeTypeOperation(this, ParseNodeTypeUnary.OPERATORS.get(this.children[1].source)!, [
				this.children[0].decorate(),
			])
	}
}
export class ParseNodeTypeBinary extends ParseNode {
	private static readonly OPERATORS: Map<Punctuator, ValidTypeOperator> = new Map<Punctuator, ValidTypeOperator>([
		[Punctuator.INTER, Operator.AND],
		[Punctuator.UNION, Operator.OR],
	])
	declare children:
		| readonly [                                      ParseNodeTypeUnary | ParseNodeTypeBinary]
		| readonly [ParseNodeTypeBinary, TokenPunctuator, ParseNodeTypeUnary | ParseNodeTypeBinary]
	decorate(): SemanticNodeType {
		return (this.children.length === 1)
			? this.children[0].decorate()
			: new SemanticNodeTypeOperation(this, ParseNodeTypeBinary.OPERATORS.get(this.children[1].source)!, [
				this.children[0].decorate(),
				this.children[2].decorate(),
			])
	}
}
export class ParseNodeType extends ParseNode {
	declare children:
		| readonly [ParseNodeTypeBinary]
	decorate(): SemanticNodeType {
		return this.children[0].decorate()
	}
}
export class ParseNodeStringTemplate extends ParseNode {
	declare children:
		| readonly [TokenTemplate]
		| readonly [TokenTemplate,                                                        TokenTemplate]
		| readonly [TokenTemplate, ParseNodeExpression,                                   TokenTemplate]
		| readonly [TokenTemplate,                      ParseNodeStringTemplate__0__List, TokenTemplate]
		| readonly [TokenTemplate, ParseNodeExpression, ParseNodeStringTemplate__0__List, TokenTemplate]
	decorate(): SemanticNodeTemplate {
		return new SemanticNodeTemplate(this, (this.children as readonly (TokenTemplate | ParseNodeExpression | ParseNodeStringTemplate__0__List)[]).flatMap((c) =>
			c instanceof Token ? [new SemanticNodeConstant(c)] :
			c instanceof ParseNodeExpression ? [c.decorate()] :
			c.decorate()
		))
	}
}
type TemplatePartialType = // FIXME spread types
	| [                        SemanticNodeConstant                        ]
	| [                        SemanticNodeConstant, SemanticNodeExpression]
	// | [...TemplatePartialType, SemanticNodeConstant                        ]
	// | [...TemplatePartialType, SemanticNodeConstant, SemanticNodeExpression]
	| SemanticNodeExpression[]
class ParseNodeStringTemplate__0__List extends ParseNode {
	declare children:
		| readonly [                                  TokenTemplate                     ]
		| readonly [                                  TokenTemplate, ParseNodeExpression]
		| readonly [ParseNodeStringTemplate__0__List, TokenTemplate                     ]
		| readonly [ParseNodeStringTemplate__0__List, TokenTemplate, ParseNodeExpression]
	decorate(): TemplatePartialType {
		return (this.children as readonly (TokenTemplate | ParseNodeExpression | ParseNodeStringTemplate__0__List)[]).flatMap((c) =>
			c instanceof Token ? [new SemanticNodeConstant(c)] :
			c instanceof ParseNodeExpression ? [c.decorate()] :
			c.decorate()
		)
	}
}
export class ParseNodeExpressionUnit extends ParseNode {
	declare children:
		| readonly [TokenIdentifier] // Dev.supports('variables')
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeStringTemplate] // Dev.supports('literalTemplate')
		| readonly [TokenPunctuator, ParseNodeExpression, TokenPunctuator]
	decorate(): SemanticNodeExpression {
		return (this.children.length === 1) ?
			(this.children[0] instanceof ParseNode) ? this.children[0].decorate() :
				new SemanticNodeIdentifier(this.children[0])
		:
			this.children[1].decorate()
	}
}
export class ParseNodeExpressionUnary extends ParseNode {
	private static readonly OPERATORS: Map<Punctuator, Operator> = new Map<Punctuator, Operator>([
		[Punctuator.NOT, Operator.NOT],
		[Punctuator.EMP, Operator.EMP],
		[Punctuator.AFF, Operator.AFF],
		[Punctuator.NEG, Operator.NEG],
	])
	declare children:
		| readonly [ParseNodeExpressionUnit]
		| readonly [TokenPunctuator, ParseNodeExpressionUnary]
	decorate(): SemanticNodeExpression {
		return (this.children.length === 1) ?
			this.children[0].decorate()
		:
			(this.children[0].source === Punctuator.AFF) ? // `+a` is a no-op
				this.children[1].decorate()
			:
				new SemanticNodeOperationUnary(this, ParseNodeExpressionUnary.OPERATORS.get(this.children[0].source) as ValidOperatorUnary, [
					this.children[1].decorate(),
				])
	}
}
export class ParseNodeExpressionBinary extends ParseNode {
	private static readonly OPERATORS: Map<Punctuator | Keyword, Operator> = new Map<Punctuator | Keyword, Operator>([
		[Punctuator.EXP,  Operator.EXP],
		[Punctuator.MUL,  Operator.MUL],
		[Punctuator.DIV,  Operator.DIV],
		[Punctuator.ADD,  Operator.ADD],
		[Punctuator.SUB,  Operator.SUB],
		[Punctuator.LT,   Operator.LT],
		[Punctuator.GT,   Operator.GT],
		[Punctuator.LE,   Operator.LE],
		[Punctuator.GE,   Operator.GE],
		[Punctuator.NLT,  Operator.NLT],
		[Punctuator.NGT,  Operator.NGT],
		[Keyword   .IS,   Operator.IS],
		[Keyword   .ISNT, Operator.ISNT],
		[Punctuator.EQ,   Operator.EQ],
		[Punctuator.NEQ,  Operator.NEQ],
		[Punctuator.AND,  Operator.AND],
		[Punctuator.NAND, Operator.NAND],
		[Punctuator.OR,   Operator.OR],
		[Punctuator.NOR,  Operator.NOR],
	])
	declare children:
		| readonly [ParseNodeExpressionUnary                                            ] // Exponential
		| readonly [ParseNodeExpressionUnary, TokenPunctuator, ParseNodeExpressionBinary] // Exponential
		| readonly [                                                           ParseNodeExpressionBinary]
		| readonly [ParseNodeExpressionBinary, TokenPunctuator | TokenKeyword, ParseNodeExpressionBinary]
	decorate(): SemanticNodeExpression {
		if (this.children.length === 1) {
			return this.children[0].decorate()
		} else {
			const operator: Operator = ParseNodeExpressionBinary.OPERATORS.get(this.children[1].source)!
			const operands: [SemanticNodeExpression, SemanticNodeExpression] = [
					this.children[0].decorate(),
					this.children[2].decorate(),
				]
			return ([
				Operator.EXP,
				Operator.MUL,
				Operator.DIV,
				Operator.ADD,
			].includes(operator)) ?
				new SemanticNodeOperationBinaryArithmetic(this, operator as ValidOperatorArithmetic, operands)
			: (operator === Operator.SUB) ? // `a - b` is syntax sugar for `a + -(b)`
				new SemanticNodeOperationBinaryArithmetic(this, Operator.ADD, [
					operands[0],
					new SemanticNodeOperationUnary(this.children[2], Operator.NEG, [
						operands[1],
					]),
				])
			: ([
				Operator.LT,
				Operator.GT,
				Operator.LE,
				Operator.GE,
			].includes(operator)) ?
				new SemanticNodeOperationBinaryComparative(this, operator as ValidOperatorComparative, operands)
			: (operator === Operator.NLT) ? // `a !< b` is syntax sugar for `!(a < b)`
				new SemanticNodeOperationUnary(this, Operator.NOT, [
					new SemanticNodeOperationBinaryComparative(this.children[0], Operator.LT, operands),
				])
			: (operator === Operator.NGT) ? // `a !> b` is syntax sugar for `!(a > b)`
				new SemanticNodeOperationUnary(this, Operator.NOT, [
					new SemanticNodeOperationBinaryComparative(this.children[0], Operator.GT, operands),
				])
			: ([
				Operator.IS,
				Operator.EQ,
			].includes(operator)) ?
				new SemanticNodeOperationBinaryEquality(this, operator as ValidOperatorEquality, operands)
			: (operator === Operator.ISNT) ? // `a isnt b` is syntax sugar for `!(a is b)`
				new SemanticNodeOperationUnary(this, Operator.NOT, [
					new SemanticNodeOperationBinaryEquality(this.children[0], Operator.IS, operands),
				])
			: (operator === Operator.NEQ) ? // `a != b` is syntax sugar for `!(a == b)`
				new SemanticNodeOperationUnary(this, Operator.NOT, [
					new SemanticNodeOperationBinaryEquality(this.children[0], Operator.EQ, operands),
				])
			: ([
				Operator.AND,
				Operator.OR,
			].includes(operator)) ?
				new SemanticNodeOperationBinaryLogical(this, operator as ValidOperatorLogical, operands)
			: (operator === Operator.NAND) ? // `a !& b` is syntax sugar for `!(a && b)`
				new SemanticNodeOperationUnary(this, Operator.NOT, [
					new SemanticNodeOperationBinaryLogical(this.children[0], Operator.AND, operands),
				])
			: (operator === Operator.NOR) ? // `a !| b` is syntax sugar for `!(a || b)`
				new SemanticNodeOperationUnary(this, Operator.NOT, [
					new SemanticNodeOperationBinaryLogical(this.children[0], Operator.OR, operands),
				])
			: (() => { throw new Error(`Operator ${ Operator[operator] } not found.`) })()
		}
	}
}
export class ParseNodeExpressionConditional extends ParseNode {
	declare children:
		| readonly [
			TokenKeyword, ParseNodeExpression,
			TokenKeyword, ParseNodeExpression,
			TokenKeyword, ParseNodeExpression,
		]
	decorate(): SemanticNodeOperationTernary {
		return new SemanticNodeOperationTernary(this, Operator.COND, [
			this.children[1].decorate(),
			this.children[3].decorate(),
			this.children[5].decorate(),
		])
	}
}
export class ParseNodeExpression extends ParseNode {
	declare children:
		| readonly [ParseNodeExpressionBinary]
		| readonly [ParseNodeExpressionConditional]
	decorate(): SemanticNodeExpression {
		return this.children[0].decorate()
	}
}
export class ParseNodeDeclarationVariable extends ParseNode {
	declare children:
		| readonly [TokenKeyword,               TokenIdentifier, TokenPunctuator, ParseNodeType, TokenPunctuator, ParseNodeExpression, TokenPunctuator]
		| readonly [TokenKeyword, TokenKeyword, TokenIdentifier, TokenPunctuator, ParseNodeType, TokenPunctuator, ParseNodeExpression, TokenPunctuator]
	decorate(): SemanticNodeDeclarationVariable {
		const is_unfixed: boolean             = this.children[1].source === Keyword.UNFIXED
		const identifier: TokenIdentifier     = this.children[is_unfixed ? 2 : 1] as TokenIdentifier
		const expression: ParseNodeExpression = this.children[is_unfixed ? 4 : 3] as ParseNodeExpression
		return new SemanticNodeDeclarationVariable(this, is_unfixed, [
			new SemanticNodeAssignee(identifier, [
				new SemanticNodeIdentifier(identifier),
			]),
			new SemanticNodeAssigned(expression, [
				expression.decorate(),
			]),
		])
	}
}
export class ParseNodeStatementAssignment extends ParseNode {
	declare children:
		| readonly [TokenIdentifier, TokenPunctuator, ParseNodeExpression, TokenPunctuator]
	decorate(): SemanticNodeAssignment {
		const identifier: TokenIdentifier     = this.children[0]
		const expression: ParseNodeExpression = this.children[2]
		return new SemanticNodeAssignment(this, [
			new SemanticNodeAssignee(identifier, [
				new SemanticNodeIdentifier(identifier),
			]),
			new SemanticNodeAssigned(expression, [
				expression.decorate(),
			]),
		])
	}
}
export class ParseNodeStatement extends ParseNode {
	declare children:
		| readonly [                     TokenPunctuator]
		| readonly [ParseNodeExpression, TokenPunctuator]
		| readonly [ParseNodeDeclarationVariable] // Dev.supports('variables')
		| readonly [ParseNodeStatementAssignment] // Dev.supports('variables')
	decorate(): SemanticStatementType {
		return (this.children.length === 1 && this.children[0] instanceof ParseNode)
			? this.children[0].decorate()
			: new SemanticNodeStatementExpression(this, (this.children.length === 1) ? [] : [
				this.children[0].decorate(),
			])
	}
}
export class ParseNodeGoal extends ParseNode {
	declare children:
		| readonly [TokenFilebound,                         TokenFilebound]
		| readonly [TokenFilebound, ParseNodeGoal__0__List, TokenFilebound]
	decorate(): SemanticNodeGoal {
		return new SemanticNodeGoal(this, (this.children.length === 2) ? [] : this.children[1].decorate())
	}
}
export class ParseNodeGoal__0__List extends ParseNode {
	declare children:
		| readonly [                        ParseNodeStatement]
		| readonly [ParseNodeGoal__0__List, ParseNodeStatement]
	decorate(): SemanticStatementType[] {
		return this.children.length === 1 ?
			[this.children[0].decorate()]
		: [
			...this.children[0].decorate(),
			this.children[1].decorate()
		]
	}
}
