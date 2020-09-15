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
	Validator,
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
	 * @param validator the validator, which stores information about the program
	 * @returns a semantic node containing this parse node’s semantics
	 */
	abstract decorate(validator: Validator): SemanticNode | SemanticNode[];

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
	/** @implement ParseNode */
	decorate(_validator: Validator): SemanticNodeConstant {
		return new SemanticNodeConstant(this.children[0])
	}
}
export class ParseNodeTypeKeyword extends ParseNode {
	declare children:
		| readonly [TokenKeyword]
	/** @implement ParseNode */
	decorate(_validator: Validator): SemanticNodeTypeConstant {
		return new SemanticNodeTypeConstant(this.children[0])
	}
}
export class ParseNodeTypeUnit extends ParseNode {
	declare children:
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeTypeKeyword]
		| readonly [TokenPunctuator, ParseNodeType, TokenPunctuator]
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticNodeType {
		return (this.children.length === 1)
			? (this.children[0] instanceof ParseNodePrimitiveLiteral)
				? new SemanticNodeTypeConstant(this.children[0].children[0])
				: this.children[0].decorate(validator)
			: this.children[1].decorate(validator)
	}
}
export class ParseNodeTypeUnary extends ParseNode {
	private static readonly OPERATORS: Map<Punctuator, ValidTypeOperator> = new Map<Punctuator, ValidTypeOperator>([
		[Punctuator.ORNULL, Operator.ORNULL],
	])
	declare children:
		| readonly [ParseNodeTypeUnit]
		| readonly [ParseNodeTypeUnary, TokenPunctuator]
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticNodeType {
		return (this.children.length === 1)
			? this.children[0].decorate(validator)
			: new SemanticNodeTypeOperation(this, ParseNodeTypeUnary.OPERATORS.get(this.children[1].source)!, [
				this.children[0].decorate(validator),
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
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticNodeType {
		return (this.children.length === 1)
			? this.children[0].decorate(validator)
			: new SemanticNodeTypeOperation(this, ParseNodeTypeBinary.OPERATORS.get(this.children[1].source)!, [
				this.children[0].decorate(validator),
				this.children[2].decorate(validator),
			])
	}
}
export class ParseNodeType extends ParseNode {
	declare children:
		| readonly [ParseNodeTypeBinary]
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticNodeType {
		return this.children[0].decorate(validator)
	}
}
export class ParseNodeStringTemplate extends ParseNode {
	declare children:
		| readonly [TokenTemplate]
		| readonly [TokenTemplate,                                                        TokenTemplate]
		| readonly [TokenTemplate, ParseNodeExpression,                                   TokenTemplate]
		| readonly [TokenTemplate,                      ParseNodeStringTemplate__0__List, TokenTemplate]
		| readonly [TokenTemplate, ParseNodeExpression, ParseNodeStringTemplate__0__List, TokenTemplate]
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticNodeTemplate {
		return new SemanticNodeTemplate(this, (this.children as readonly (TokenTemplate | ParseNodeExpression | ParseNodeStringTemplate__0__List)[]).flatMap((c) =>
			c instanceof Token ? [new SemanticNodeConstant(c)] :
			c instanceof ParseNodeExpression ? [c.decorate(validator)] :
			c.decorate(validator)
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
	/** @implement ParseNode */
	decorate(validator: Validator): TemplatePartialType {
		return (this.children as readonly (TokenTemplate | ParseNodeExpression | ParseNodeStringTemplate__0__List)[]).flatMap((c) =>
			c instanceof Token ? [new SemanticNodeConstant(c)] :
			c instanceof ParseNodeExpression ? [c.decorate(validator)] :
			c.decorate(validator)
		)
	}
}
export class ParseNodeExpressionUnit extends ParseNode {
	declare children:
		| readonly [TokenIdentifier] // Dev.supports('variables')
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeStringTemplate] // Dev.supports('literalTemplate')
		| readonly [TokenPunctuator, ParseNodeExpression, TokenPunctuator]
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticNodeExpression {
		return (this.children.length === 1) ?
			(this.children[0] instanceof ParseNode) ? this.children[0].decorate(validator) :
				new SemanticNodeIdentifier(this.children[0])
		:
			this.children[1].decorate(validator)
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
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticNodeExpression {
		return (this.children.length === 1) ?
			this.children[0].decorate(validator)
		:
			(this.children[0].source === Punctuator.AFF) ? // `+a` is a no-op
				this.children[1].decorate(validator)
			:
				new SemanticNodeOperationUnary(this, ParseNodeExpressionUnary.OPERATORS.get(this.children[0].source) as ValidOperatorUnary, [
					this.children[1].decorate(validator),
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
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticNodeExpression {
		if (this.children.length === 1) {
			return this.children[0].decorate(validator)
		} else {
			const operator: Operator = ParseNodeExpressionBinary.OPERATORS.get(this.children[1].source)!
			const operands: [SemanticNodeExpression, SemanticNodeExpression] = [
				this.children[0].decorate(validator),
				this.children[2].decorate(validator),
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
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticNodeOperationTernary {
		return new SemanticNodeOperationTernary(this, Operator.COND, [
			this.children[1].decorate(validator),
			this.children[3].decorate(validator),
			this.children[5].decorate(validator),
		])
	}
}
export class ParseNodeExpression extends ParseNode {
	declare children:
		| readonly [ParseNodeExpressionBinary]
		| readonly [ParseNodeExpressionConditional]
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticNodeExpression {
		return this.children[0].decorate(validator)
	}
}
export class ParseNodeDeclarationVariable extends ParseNode {
	declare children:
		| readonly [TokenKeyword,               TokenIdentifier, TokenPunctuator, ParseNodeType, TokenPunctuator, ParseNodeExpression, TokenPunctuator]
		| readonly [TokenKeyword, TokenKeyword, TokenIdentifier, TokenPunctuator, ParseNodeType, TokenPunctuator, ParseNodeExpression, TokenPunctuator]
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticNodeDeclarationVariable {
		const identifier: TokenIdentifier     = (this.children.length === 7) ? this.children[1] : this.children[2]
		const type_:      ParseNodeType       = (this.children.length === 7) ? this.children[3] : this.children[4]
		const expression: ParseNodeExpression = (this.children.length === 7) ? this.children[5] : this.children[6]
		return new SemanticNodeDeclarationVariable(this, this.children.length === 8, [
			new SemanticNodeAssignee(identifier, [
				new SemanticNodeIdentifier(identifier),
			]),
			new SemanticNodeAssigned(expression, [
				expression.decorate(validator),
			]),
		])
	}
}
export class ParseNodeStatementAssignment extends ParseNode {
	declare children:
		| readonly [TokenIdentifier, TokenPunctuator, ParseNodeExpression, TokenPunctuator]
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticNodeAssignment {
		const identifier: TokenIdentifier     = this.children[0]
		const expression: ParseNodeExpression = this.children[2]
		return new SemanticNodeAssignment(this, [
			new SemanticNodeAssignee(identifier, [
				new SemanticNodeIdentifier(identifier),
			]),
			new SemanticNodeAssigned(expression, [
				expression.decorate(validator),
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
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticStatementType {
		return (this.children.length === 1 && this.children[0] instanceof ParseNode)
			? this.children[0].decorate(validator)
			: new SemanticNodeStatementExpression(this, (this.children.length === 1) ? [] : [
				this.children[0].decorate(validator),
			])
	}
}
export class ParseNodeGoal extends ParseNode {
	declare children:
		| readonly [TokenFilebound,                         TokenFilebound]
		| readonly [TokenFilebound, ParseNodeGoal__0__List, TokenFilebound]
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticNodeGoal {
		return new SemanticNodeGoal(this, (this.children.length === 2) ? [] : this.children[1].decorate(validator))
	}
}
export class ParseNodeGoal__0__List extends ParseNode {
	declare children:
		| readonly [                        ParseNodeStatement]
		| readonly [ParseNodeGoal__0__List, ParseNodeStatement]
	/** @implement ParseNode */
	decorate(validator: Validator): SemanticStatementType[] {
		return this.children.length === 1 ?
			[this.children[0].decorate(validator)]
		: [
			...this.children[0].decorate(validator),
			this.children[1].decorate(validator)
		]
	}
}
