import {
	ParseNode,
} from '@chharvey/parser';

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
	TOKEN,
	PARSER,
} from '../parser/'
import * as AST from './ASTNode';



type TemplatePartialType = // FIXME spread types
	| [                        AST.SemanticNodeConstant                            ]
	| [                        AST.SemanticNodeConstant, AST.SemanticNodeExpression]
	// | [...TemplatePartialType, AST.SemanticNodeConstant                            ]
	// | [...TemplatePartialType, AST.SemanticNodeConstant, AST.SemanticNodeExpression]
	| AST.SemanticNodeExpression[]
;



export class Decorator {
	private static readonly TYPEOPERATORS_UNARY: ReadonlyMap<Punctuator, ValidTypeOperator> = new Map<Punctuator, ValidTypeOperator>([
		[Punctuator.ORNULL, Operator.ORNULL],
	])
	private static readonly TYPEOPERATORS_BINARY: ReadonlyMap<Punctuator, ValidTypeOperator> = new Map<Punctuator, ValidTypeOperator>([
		[Punctuator.INTER, Operator.AND],
		[Punctuator.UNION, Operator.OR],
	])
	private static readonly OPERATORS_UNARY: ReadonlyMap<Punctuator, Operator> = new Map<Punctuator, Operator>([
		[Punctuator.NOT, Operator.NOT],
		[Punctuator.EMP, Operator.EMP],
		[Punctuator.AFF, Operator.AFF],
		[Punctuator.NEG, Operator.NEG],
	])
	private static readonly OPERATORS_BINARY: ReadonlyMap<Punctuator | Keyword, Operator> = new Map<Punctuator | Keyword, Operator>([
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

	/**
	 * Return an ASTNode corresponding to a ParseNode’s contents.
	 * @param node the parse node to decorate
	 * @returns an ASTNode
	 */
	static decorate(node: PARSER.ParseNodePrimitiveLiteral): AST.SemanticNodeConstant;
	static decorate(node: PARSER.ParseNodeTypeKeyword):      AST.ASTNodeTypeConstant;
	static decorate(node:
		| PARSER.ParseNodeTypeUnit
		| PARSER.ParseNodeTypeUnarySymbol
		| PARSER.ParseNodeTypeIntersection
		| PARSER.ParseNodeTypeUnion
		| PARSER.ParseNodeType
	): AST.ASTNodeType;
	static decorate(node: PARSER.ParseNodeStringTemplate__1__List):  TemplatePartialType;
	static decorate(node: PARSER.ParseNodeStringTemplate):           AST.SemanticNodeTemplate;
	static decorate(node:
		| PARSER.ParseNodeExpressionUnit
		| PARSER.ParseNodeExpressionUnarySymbol
		| PARSER.ParseNodeExpressionExponential
		| PARSER.ParseNodeExpressionMultiplicative
		| PARSER.ParseNodeExpressionAdditive
		| PARSER.ParseNodeExpressionComparative
		| PARSER.ParseNodeExpressionEquality
		| PARSER.ParseNodeExpressionConjunctive
		| PARSER.ParseNodeExpressionDisjunctive
		| PARSER.ParseNodeExpression
	): AST.SemanticNodeExpression;
	static decorate(node: PARSER.ParseNodeExpressionConditional): AST.SemanticNodeOperationTernary;
	static decorate(node: PARSER.ParseNodeDeclarationVariable):   AST.SemanticNodeDeclarationVariable;
	static decorate(node: PARSER.ParseNodeStatementAssignment):   AST.SemanticNodeAssignment;
	static decorate(node: PARSER.ParseNodeStatement):             AST.SemanticStatementType;
	static decorate(node: PARSER.ParseNodeGoal__0__List):         AST.SemanticStatementType[];
	static decorate(node: PARSER.ParseNodeGoal):                  AST.SemanticNodeGoal;
	static decorate(node: ParseNode): AST.ASTNodeSolid | AST.ASTNodeSolid[];
	static decorate(node: ParseNode): AST.ASTNodeSolid | AST.ASTNodeSolid[] {
		if (node instanceof PARSER.ParseNodePrimitiveLiteral) {
			return new AST.SemanticNodeConstant(node.children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString);

		} else if (node instanceof PARSER.ParseNodeTypeKeyword) {
			return new AST.ASTNodeTypeConstant(node.children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString);

		} else if (node instanceof PARSER.ParseNodeTypeUnit) {
			return (node.children.length === 1)
				? (node.children[0] instanceof PARSER.ParseNodePrimitiveLiteral)
					? new AST.ASTNodeTypeConstant(node.children[0].children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString)
					: this.decorate(node.children[0])
				: this.decorate(node.children[1])

		} else if (node instanceof PARSER.ParseNodeTypeUnarySymbol) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new AST.ASTNodeTypeOperationUnary(node, this.TYPEOPERATORS_UNARY.get(node.children[1].source as Punctuator)!, [
					this.decorate(node.children[0]),
				])

		} else if (
			node instanceof PARSER.ParseNodeTypeIntersection ||
			node instanceof PARSER.ParseNodeTypeUnion
		) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new AST.ASTNodeTypeOperationBinary(node, this.TYPEOPERATORS_BINARY.get(node.children[1].source as Punctuator)!, [
					this.decorate(node.children[0]),
					this.decorate(node.children[2]),
				])

		} else if (node instanceof PARSER.ParseNodeType) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSER.ParseNodeStringTemplate__1__List) {
			return (node.children as readonly (TOKEN.TokenTemplate | PARSER.ParseNodeExpression | PARSER.ParseNodeStringTemplate__1__List)[]).flatMap((c) =>
				c instanceof TOKEN.TokenTemplate ? [new AST.SemanticNodeConstant(c)] :
				c instanceof PARSER.ParseNodeExpression ? [this.decorate(c)] :
				this.decorate(c)
			)

		} else if (node instanceof PARSER.ParseNodeStringTemplate) {
			return new AST.SemanticNodeTemplate(node, (node.children as readonly (TOKEN.TokenTemplate | PARSER.ParseNodeExpression | PARSER.ParseNodeStringTemplate__1__List)[]).flatMap((c) =>
				c instanceof TOKEN.TokenTemplate ? [new AST.SemanticNodeConstant(c)] :
				c instanceof PARSER.ParseNodeExpression ? [this.decorate(c)] :
				this.decorate(c)
			))

		} else if (node instanceof PARSER.ParseNodeExpressionUnit) {
			return (node.children.length === 1)
				? (node.children[0] instanceof ParseNode)
					? this.decorate(node.children[0])
					: new AST.SemanticNodeIdentifier(node.children[0] as TOKEN.TokenIdentifier)
				: this.decorate(node.children[1])

		} else if (node instanceof PARSER.ParseNodeExpressionUnarySymbol) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: (node.children[0].source === Punctuator.AFF) // `+a` is a no-op
					? this.decorate(node.children[1])
					: new AST.SemanticNodeOperationUnary(node, this.OPERATORS_UNARY.get(node.children[0].source as Punctuator) as ValidOperatorUnary, [
						this.decorate(node.children[1]),
					])

		} else if (
			node instanceof PARSER.ParseNodeExpressionExponential    ||
			node instanceof PARSER.ParseNodeExpressionMultiplicative ||
			node instanceof PARSER.ParseNodeExpressionAdditive       ||
			node instanceof PARSER.ParseNodeExpressionComparative    ||
			node instanceof PARSER.ParseNodeExpressionEquality       ||
			node instanceof PARSER.ParseNodeExpressionConjunctive    ||
			node instanceof PARSER.ParseNodeExpressionDisjunctive
		) {
			if (node.children.length === 1) {
				return this.decorate(node.children[0])
			} else {
				const operator: Operator = this.OPERATORS_BINARY.get(node.children[1].source as Punctuator | Keyword)!;
				const operands: [AST.SemanticNodeExpression, AST.SemanticNodeExpression] = [
					this.decorate(node.children[0]),
					this.decorate(node.children[2]),
				];
				return (
					node instanceof PARSER.ParseNodeExpressionExponential    ||
					node instanceof PARSER.ParseNodeExpressionMultiplicative ||
					node instanceof PARSER.ParseNodeExpressionAdditive
				) ? (
					// `a - b` is syntax sugar for `a + -(b)`
					(operator === Operator.SUB) ? new AST.SemanticNodeOperationBinaryArithmetic(node, Operator.ADD, [
						operands[0],
						new AST.SemanticNodeOperationUnary(node.children[2], Operator.NEG, [
							operands[1],
						]),
					]) :
					new AST.SemanticNodeOperationBinaryArithmetic(node, operator as ValidOperatorArithmetic, operands)

				) : (node instanceof PARSER.ParseNodeExpressionComparative) ? (
					// `a !< b` is syntax sugar for `!(a < b)`
					(operator === Operator.NLT) ? new AST.SemanticNodeOperationUnary(node, Operator.NOT, [
						new AST.SemanticNodeOperationBinaryComparative(node.children[0], Operator.LT, operands),
					]) :
					// `a !> b` is syntax sugar for `!(a > b)`
					(operator === Operator.NGT) ? new AST.SemanticNodeOperationUnary(node, Operator.NOT, [
						new AST.SemanticNodeOperationBinaryComparative(node.children[0], Operator.GT, operands),
					]) :
					new AST.SemanticNodeOperationBinaryComparative(node, operator as ValidOperatorComparative, operands)

				) : (node instanceof PARSER.ParseNodeExpressionEquality) ? (
					// `a isnt b` is syntax sugar for `!(a is b)`
					(operator === Operator.ISNT) ? new AST.SemanticNodeOperationUnary(node, Operator.NOT, [
						new AST.SemanticNodeOperationBinaryEquality(node.children[0], Operator.IS, operands),
					]) :
					// `a != b` is syntax sugar for `!(a == b)`
					(operator === Operator.NEQ) ? new AST.SemanticNodeOperationUnary(node, Operator.NOT, [
						new AST.SemanticNodeOperationBinaryEquality(node.children[0], Operator.EQ, operands),
					]) :
					new AST.SemanticNodeOperationBinaryEquality(node, operator as ValidOperatorEquality, operands)

				) : /* (
					node instanceof PARSER.ParseNodeExpressionConjunctive ||
					node instanceof PARSER.ParseNodeExpressionDisjunctive
				) ? */ (
					// `a !& b` is syntax sugar for `!(a && b)`
					(operator === Operator.NAND) ? new AST.SemanticNodeOperationUnary(node, Operator.NOT, [
						new AST.SemanticNodeOperationBinaryLogical(node.children[0], Operator.AND, operands),
					]) :
					// `a !| b` is syntax sugar for `!(a || b)`
					(operator === Operator.NOR) ? new AST.SemanticNodeOperationUnary(node, Operator.NOT, [
						new AST.SemanticNodeOperationBinaryLogical(node.children[0], Operator.OR, operands),
					]) :
					new AST.SemanticNodeOperationBinaryLogical(node, operator as ValidOperatorLogical, operands)
				)
			}

		} else if (node instanceof PARSER.ParseNodeExpressionConditional) {
			return new AST.SemanticNodeOperationTernary(node, Operator.COND, [
				this.decorate(node.children[1]),
				this.decorate(node.children[3]),
				this.decorate(node.children[5]),
			])

		} else if (node instanceof PARSER.ParseNodeExpression) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSER.ParseNodeDeclarationVariable) {
			const identifier: TOKEN.TokenIdentifier      = ((node.children.length === 7) ? node.children[1] : node.children[2]) as TOKEN.TokenIdentifier
			const type_:      PARSER.ParseNodeType       =  (node.children.length === 7) ? node.children[3] : node.children[4]
			const expression: PARSER.ParseNodeExpression =  (node.children.length === 7) ? node.children[5] : node.children[6]
			return new AST.SemanticNodeDeclarationVariable(node, node.children.length === 8, [
				new AST.SemanticNodeAssignee(identifier, [
					new AST.SemanticNodeIdentifier(identifier),
				]),
				this.decorate(type_),
				this.decorate(expression),
			])

		} else if (node instanceof PARSER.ParseNodeStatementAssignment) {
			const identifier: TOKEN.TokenIdentifier      = node.children[0] as TOKEN.TokenIdentifier
			const expression: PARSER.ParseNodeExpression = node.children[2]
			return new AST.SemanticNodeAssignment(node, [
				new AST.SemanticNodeAssignee(identifier, [
					new AST.SemanticNodeIdentifier(identifier),
				]),
				this.decorate(expression),
			])

		} else if (node instanceof PARSER.ParseNodeStatement) {
			return (node.children.length === 1 && node.children[0] instanceof ParseNode)
				? this.decorate(node.children[0])
				: new AST.SemanticNodeStatementExpression(node, (node.children.length === 1) ? [] : [
					this.decorate(node.children[0]),
				])

		} else if (node instanceof PARSER.ParseNodeGoal__0__List) {
			return (node.children.length === 1) ?
				[this.decorate(node.children[0])]
			: [
				...this.decorate(node.children[0]),
				this.decorate(node.children[1]),
			]

		} else if (node instanceof PARSER.ParseNodeGoal) {
			return new AST.SemanticNodeGoal(node, (node.children.length === 2) ? [] : this.decorate(node.children[1]));

		} else {
			throw new ReferenceError(`Could not find type of parse node ${ node }.`)
		}
	}
}
