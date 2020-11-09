import {
	ParseNode,
} from '@chharvey/parser';
import SolidConfig, {CONFIG_DEFAULT} from '../SolidConfig';
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
	ParserSolid as Parser,
	PARSER,
} from '../parser/'
import {
	SemanticNodeSolid,
	SemanticNodeType,
	SemanticNodeTypeConstant,
	SemanticNodeTypeOperationUnary,
	SemanticNodeTypeOperationBinary,
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
	SemanticStatementType,
	SemanticNodeStatementExpression,
	SemanticNodeGoal,
} from './SemanticNode.class'
import type SolidLanguageType from './SolidLanguageType.class'



type TemplatePartialType = // FIXME spread types
	| [                        SemanticNodeConstant                        ]
	| [                        SemanticNodeConstant, SemanticNodeExpression]
	// | [...TemplatePartialType, SemanticNodeConstant                        ]
	// | [...TemplatePartialType, SemanticNodeConstant, SemanticNodeExpression]
	| SemanticNodeExpression[]



/**
 * An object containing symbol information.
 * A “symbol” is a variable or other declaration in source code.
 * - name: the identifier string
 * - type: the type of the variable
 * - line: the 0-based line   index of where the varible was declared
 * - col:  the 0-based column index of where the varible was declared
 */
type SymbolInfo = {
	name: string;
	type: SolidLanguageType;
	line: number;
	col:  number;
}



/**
 * The Validator is responsible for semantically analyzing, type-checking, and validating source code.
 *
 * Part of semantic analysis is the Decorator, which transforms concrete parse nodes into abstract semantic nodes.
 * It prepares the nodes for the Validator by performing certian operations such as:
 * - removing unnecessary nested nodes, e.g. `(unary (unit (prim 2)))` becomes `(const 2)`
 * - replacing certain syntaxes with data, e.g.
 * 	from `(additive (additive (... 2)) (token '+') (multiplicative (... 3)))`
 * 	to `(sum (const 2) (const 3))`
 */
export default class Validator {
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


	/** A syntactic goal produced by a parser. */
	private readonly parsegoal: PARSER.ParseNodeGoal;
	/** A symbol table, which keeps tracks of variables. */
	private readonly symbol_table: Map<string, SymbolInfo> = new Map()

	/**
	 * Construct a new Validator object.
	 * @param source - the source text
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		source: string,
		private readonly config: SolidConfig = CONFIG_DEFAULT,
	) {
		this.parsegoal = new Parser(source, config).parse();
	}

	/**
	 * Add a symbol to this Validator’s symbol table.
	 * @param name  the symbol name to add
	 * @param type_ the symbol type
	 * @param line  the line   number of the symbol’s declaration
	 * @param col   the column number of the symbol’s declaration
	 * @returns this
	 */
	addSymbol(name: string, type_: SolidLanguageType, line: number, col: number): this {
		this.symbol_table.set(name, {name, type: type_, line, col})
		return this
	}
	/**
	 * Remove a symbol from this Validator’s symbol table.
	 * @param name the symbol name to remove
	 * @returns this
	 */
	removeSymbool(name: string): this {
		this.symbol_table.delete(name)
		return this
	}
	/**
	 * Check whether this Validator’s symbol table has the symbol.
	 * @param name the symbol name to check
	 * @returns Doees the symbol table have a symbol called `name`?
	 */
	hasSymbol(name: string): boolean {
		return this.symbol_table.has(name)
	}
	/**
	 * Return the information of a symol in this Validator’s symbol table.
	 * @param name the symbol name to check
	 * @returns the symbol information of `name`, or `null` if there is no corresponding entry
	 */
	getSymbolInfo(name: string): SymbolInfo | null {
		return this.symbol_table.get(name) || null
	}


	/**
	 * Return a Semantic Node, a node of the Semantic Tree or “decorated/abstract syntax tree”.
	 * @param node the parse node to decorate
	 * @returns a semantic node containing the parse node’s semantics
	 */
	decorate(node: PARSER.ParseNodePrimitiveLiteral):         SemanticNodeConstant;
	decorate(node: PARSER.ParseNodeTypeKeyword):              SemanticNodeTypeConstant;
	decorate(node:
		| PARSER.ParseNodeTypeUnit
		| PARSER.ParseNodeTypeUnarySymbol
		| PARSER.ParseNodeTypeIntersection
		| PARSER.ParseNodeTypeUnion
		| PARSER.ParseNodeType
	): SemanticNodeType;
	decorate(node: PARSER.ParseNodeStringTemplate$__1__List): TemplatePartialType;
	decorate(node: PARSER.ParseNodeStringTemplate$):          SemanticNodeTemplate;
	decorate(node:
		| PARSER.ParseNodeExpressionUnit$
		| PARSER.ParseNodeExpressionUnarySymbol$
		| PARSER.ParseNodeExpressionExponential$
		| PARSER.ParseNodeExpressionMultiplicative$
		| PARSER.ParseNodeExpressionAdditive$
		| PARSER.ParseNodeExpressionComparative$
		| PARSER.ParseNodeExpressionEquality$
		| PARSER.ParseNodeExpressionConjunctive$
		| PARSER.ParseNodeExpressionDisjunctive$
		| PARSER.ParseNodeExpression$
	): SemanticNodeExpression;
	decorate(node: PARSER.ParseNodeExpressionConditional$):   SemanticNodeOperationTernary;
	decorate(node: PARSER.ParseNodeDeclarationVariable):      SemanticNodeDeclarationVariable;
	decorate(node: PARSER.ParseNodeStatementAssignment):      SemanticNodeAssignment;
	decorate(node: PARSER.ParseNodeStatement):                SemanticStatementType;
	decorate(node: PARSER.ParseNodeGoal__0__List):            SemanticStatementType[];
	decorate(node: PARSER.ParseNodeGoal):                     SemanticNodeGoal;
	decorate(node: ParseNode): SemanticNodeSolid | SemanticNodeSolid[];
	decorate(node: ParseNode): SemanticNodeSolid | SemanticNodeSolid[] {
		if (node instanceof PARSER.ParseNodePrimitiveLiteral) {
			return new SemanticNodeConstant(node.children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString)

		} else if (node instanceof PARSER.ParseNodeTypeKeyword) {
			return new SemanticNodeTypeConstant(node.children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString)

		} else if (node instanceof PARSER.ParseNodeTypeUnit) {
			return (node.children.length === 1)
				? (node.children[0] instanceof PARSER.ParseNodePrimitiveLiteral)
					? new SemanticNodeTypeConstant(node.children[0].children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString)
					: this.decorate(node.children[0])
				: this.decorate(node.children[1])

		} else if (node instanceof PARSER.ParseNodeTypeUnarySymbol) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new SemanticNodeTypeOperationUnary(node, Validator.TYPEOPERATORS_UNARY.get(node.children[1].source as Punctuator)!, [
					this.decorate(node.children[0]),
				])

		} else if (
			node instanceof PARSER.ParseNodeTypeIntersection ||
			node instanceof PARSER.ParseNodeTypeUnion
		) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new SemanticNodeTypeOperationBinary(node, Validator.TYPEOPERATORS_BINARY.get(node.children[1].source as Punctuator)!, [
					this.decorate(node.children[0]),
					this.decorate(node.children[2]),
				])

		} else if (node instanceof PARSER.ParseNodeType) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSER.ParseNodeStringTemplate$__1__List) {
			return (node.children as readonly (TOKEN.TokenTemplate | PARSER.ParseNodeExpression$ | PARSER.ParseNodeStringTemplate$__1__List)[]).flatMap((c) =>
				(c instanceof TOKEN.TokenTemplate) ? [new SemanticNodeConstant(c)] :
				(c instanceof PARSER.ParseNodeExpression$) ? [this.decorate(c)] :
				this.decorate(c)
			)

		} else if (node instanceof PARSER.ParseNodeStringTemplate$) {
			return new SemanticNodeTemplate(node, (node.children as readonly (TOKEN.TokenTemplate | PARSER.ParseNodeExpression$ | PARSER.ParseNodeStringTemplate$__1__List)[]).flatMap((c) =>
				(c instanceof TOKEN.TokenTemplate) ? [new SemanticNodeConstant(c)] :
				(c instanceof PARSER.ParseNodeExpression$) ? [this.decorate(c)] :
				this.decorate(c)
			))

		} else if (node instanceof PARSER.ParseNodeExpressionUnit) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: this.decorate(node.children[1])

		} else if (node instanceof PARSER.ParseNodeExpressionUnit_Dynamic) {
			return (node.children.length === 1)
				? (node.children[0] instanceof ParseNode)
					? this.decorate(node.children[0])
					: new SemanticNodeIdentifier(node.children[0] as TOKEN.TokenIdentifier)
				: this.decorate(node.children[1])

		} else if (node instanceof PARSER.ParseNodeExpressionUnarySymbol$) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: (node.children[0].source === Punctuator.AFF) // `+a` is a no-op
					? this.decorate(node.children[1])
					: new SemanticNodeOperationUnary(node, Validator.OPERATORS_UNARY.get(node.children[0].source as Punctuator) as ValidOperatorUnary, [
						this.decorate(node.children[1]),
					])

		} else if (
			node instanceof PARSER.ParseNodeExpressionExponential$    ||
			node instanceof PARSER.ParseNodeExpressionMultiplicative$ ||
			node instanceof PARSER.ParseNodeExpressionAdditive$       ||
			node instanceof PARSER.ParseNodeExpressionComparative$    ||
			node instanceof PARSER.ParseNodeExpressionEquality$       ||
			node instanceof PARSER.ParseNodeExpressionConjunctive$    ||
			node instanceof PARSER.ParseNodeExpressionDisjunctive$
		) {
			if (node.children.length === 1) {
				return this.decorate(node.children[0])
			} else {
				const operator: Operator = Validator.OPERATORS_BINARY.get(node.children[1].source as Punctuator | Keyword)!
				const operands: [SemanticNodeExpression, SemanticNodeExpression] = [
					this.decorate(node.children[0]),
					this.decorate(node.children[2]),
				]
				return (
					node instanceof PARSER.ParseNodeExpressionExponential$    ||
					node instanceof PARSER.ParseNodeExpressionMultiplicative$ ||
					node instanceof PARSER.ParseNodeExpressionAdditive$
				) ? (
					// `a - b` is syntax sugar for `a + -(b)`
					(operator === Operator.SUB) ? new SemanticNodeOperationBinaryArithmetic(node, Operator.ADD, [
						operands[0],
						new SemanticNodeOperationUnary(node.children[2], Operator.NEG, [
							operands[1],
						]),
					]) :
					new SemanticNodeOperationBinaryArithmetic(node, operator as ValidOperatorArithmetic, operands)

				) : (node instanceof PARSER.ParseNodeExpressionComparative$) ? (
					// `a !< b` is syntax sugar for `!(a < b)`
					(operator === Operator.NLT) ? new SemanticNodeOperationUnary(node, Operator.NOT, [
						new SemanticNodeOperationBinaryComparative(node.children[0], Operator.LT, operands),
					]) :
					// `a !> b` is syntax sugar for `!(a > b)`
					(operator === Operator.NGT) ? new SemanticNodeOperationUnary(node, Operator.NOT, [
						new SemanticNodeOperationBinaryComparative(node.children[0], Operator.GT, operands),
					]) :
					new SemanticNodeOperationBinaryComparative(node, operator as ValidOperatorComparative, operands)

				) : (node instanceof PARSER.ParseNodeExpressionEquality$) ? (
					// `a isnt b` is syntax sugar for `!(a is b)`
					(operator === Operator.ISNT) ? new SemanticNodeOperationUnary(node, Operator.NOT, [
						new SemanticNodeOperationBinaryEquality(node.children[0], Operator.IS, operands),
					]) :
					// `a != b` is syntax sugar for `!(a == b)`
					(operator === Operator.NEQ) ? new SemanticNodeOperationUnary(node, Operator.NOT, [
						new SemanticNodeOperationBinaryEquality(node.children[0], Operator.EQ, operands),
					]) :
					new SemanticNodeOperationBinaryEquality(node, operator as ValidOperatorEquality, operands)

				) : /* (
					node instanceof PARSER.ParseNodeExpressionConjunctive$ ||
					node instanceof PARSER.ParseNodeExpressionDisjunctive$
				) ? */ (
					// `a !& b` is syntax sugar for `!(a && b)`
					(operator === Operator.NAND) ? new SemanticNodeOperationUnary(node, Operator.NOT, [
						new SemanticNodeOperationBinaryLogical(node.children[0], Operator.AND, operands),
					]) :
					// `a !| b` is syntax sugar for `!(a || b)`
					(operator === Operator.NOR) ? new SemanticNodeOperationUnary(node, Operator.NOT, [
						new SemanticNodeOperationBinaryLogical(node.children[0], Operator.OR, operands),
					]) :
					new SemanticNodeOperationBinaryLogical(node, operator as ValidOperatorLogical, operands)
				)
			}

		} else if (node instanceof PARSER.ParseNodeExpressionConditional$) {
			return new SemanticNodeOperationTernary(node, Operator.COND, [
				this.decorate(node.children[1]),
				this.decorate(node.children[3]),
				this.decorate(node.children[5]),
			])

		} else if (node instanceof PARSER.ParseNodeExpression$) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSER.ParseNodeDeclarationVariable) {
			const identifier: TOKEN.TokenIdentifier      = ((node.children.length === 7) ? node.children[1] : node.children[2]) as TOKEN.TokenIdentifier
			const type_:      PARSER.ParseNodeType       =  (node.children.length === 7) ? node.children[3] : node.children[4]
			const expression: PARSER.ParseNodeExpression_Dynamic =  (node.children.length === 7) ? node.children[5] : node.children[6]
			return new SemanticNodeDeclarationVariable(node, node.children.length === 8, [
				new SemanticNodeAssignee(identifier, [
					new SemanticNodeIdentifier(identifier),
				]),
				this.decorate(type_),
				this.decorate(expression),
			])

		} else if (node instanceof PARSER.ParseNodeStatementAssignment) {
			const identifier: TOKEN.TokenIdentifier      = node.children[0] as TOKEN.TokenIdentifier
			const expression: PARSER.ParseNodeExpression_Dynamic = node.children[2]
			return new SemanticNodeAssignment(node, [
				new SemanticNodeAssignee(identifier, [
					new SemanticNodeIdentifier(identifier),
				]),
				this.decorate(expression),
			])

		} else if (node instanceof PARSER.ParseNodeStatement) {
			return (node.children.length === 1 && node.children[0] instanceof ParseNode)
				? this.decorate(node.children[0])
				: new SemanticNodeStatementExpression(node, (node.children.length === 1) ? [] : [
					this.decorate(node.children[0]),
				])

		} else if (node instanceof PARSER.ParseNodeGoal__0__List) {
			return node.children.length === 1 ?
				[this.decorate(node.children[0])]
			: [
				...this.decorate(node.children[0]),
				this.decorate(node.children[1])
			]

		} else if (node instanceof PARSER.ParseNodeGoal) {
			return new SemanticNodeGoal(node, (node.children.length === 2) ? [] : this.decorate(node.children[1]))

		} else {
			throw new ReferenceError(`Could not find type of parse node ${ node }.`)
		}
	}


	/**
	 * Type-check the entire source.
	 * Assert that there are no type errors, and then return a semantic goal symbol.
	 * @return the decorated goal parse node
	 */
	validate(): SemanticNodeGoal {
		const semantic_goal: SemanticNodeGoal = this.decorate(this.parsegoal)
		semantic_goal.typeCheck(this.config.compilerOptions) // assert does not throw
		return semantic_goal
	}
}
