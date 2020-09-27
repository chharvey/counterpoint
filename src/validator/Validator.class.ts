import type SolidConfig from '../SolidConfig'
import Operator, {
	ValidTypeOperator,
	ValidOperatorUnary,
	ValidOperatorArithmetic,
	ValidOperatorComparative,
	ValidOperatorEquality,
	ValidOperatorLogical,
} from '../enum/Operator.enum'
import Token, {
	Punctuator,
	Keyword,
	TokenIdentifier,
	TokenTemplate,
} from '../lexer/Token.class'
import {
	ParseNode,
	ParseNodePrimitiveLiteral,
	ParseNodeTypeKeyword,
	ParseNodeTypeUnit,
	ParseNodeTypeUnary,
	ParseNodeTypeBinary,
	ParseNodeType,
	ParseNodeStringTemplate,
	ParseNodeStringTemplate__0__List,
	ParseNodeExpressionUnit,
	ParseNodeExpressionUnary,
	ParseNodeExpressionBinary,
	ParseNodeExpressionConditional,
	ParseNodeExpression,
	ParseNodeDeclarationVariable,
	ParseNodeStatementAssignment,
	ParseNodeStatement,
	ParseNodeGoal,
	ParseNodeGoal__0__List,
	TemplatePartialType,
} from '../parser/ParseNode.class'
import {Builder} from '../builder/'
import SemanticNode, {
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
	private static readonly TYPEOPERATORS_UNARY: Map<Punctuator, ValidTypeOperator> = new Map<Punctuator, ValidTypeOperator>([
		[Punctuator.ORNULL, Operator.ORNULL],
	])
	private static readonly TYPEOPERATORS_BINARY: Map<Punctuator, ValidTypeOperator> = new Map<Punctuator, ValidTypeOperator>([
		[Punctuator.INTER, Operator.AND],
		[Punctuator.UNION, Operator.OR],
	])
	private static readonly OPERATORS_UNARY: Map<Punctuator, Operator> = new Map<Punctuator, Operator>([
		[Punctuator.NOT, Operator.NOT],
		[Punctuator.EMP, Operator.EMP],
		[Punctuator.AFF, Operator.AFF],
		[Punctuator.NEG, Operator.NEG],
	])
	private static readonly OPERATORS_BINARY: Map<Punctuator | Keyword, Operator> = new Map<Punctuator | Keyword, Operator>([
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


	/** A symbol table, which keeps tracks of variables. */
	private readonly symbol_table: Map<string, SymbolInfo> = new Map()

	/**
	 * Construct a new Validator object.
	 * @param parsegoal - A syntactic goal produced by a parser.
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		private readonly parsegoal: ParseNodeGoal,
		private readonly config: SolidConfig,
	) {
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
	decorate(node: ParseNodePrimitiveLiteral):        SemanticNodeConstant;
	decorate(node: ParseNodeTypeKeyword):             SemanticNodeTypeConstant;
	decorate(node: ParseNodeTypeUnit):                SemanticNodeType;
	decorate(node: ParseNodeTypeUnary):               SemanticNodeType;
	decorate(node: ParseNodeTypeBinary):              SemanticNodeType;
	decorate(node: ParseNodeType):                    SemanticNodeType;
	decorate(node: ParseNodeStringTemplate):          SemanticNodeTemplate;
	decorate(node: ParseNodeStringTemplate__0__List): TemplatePartialType;
	decorate(node: ParseNodeExpressionUnit):          SemanticNodeExpression;
	decorate(node: ParseNodeExpressionUnary):         SemanticNodeExpression;
	decorate(node: ParseNodeExpressionBinary):        SemanticNodeExpression;
	decorate(node: ParseNodeExpressionConditional):   SemanticNodeOperationTernary;
	decorate(node: ParseNodeExpression):              SemanticNodeExpression;
	decorate(node: ParseNodeDeclarationVariable):     SemanticNodeDeclarationVariable;
	decorate(node: ParseNodeStatementAssignment):     SemanticNodeAssignment;
	decorate(node: ParseNodeStatement):               SemanticStatementType;
	decorate(node: ParseNodeGoal):                    SemanticNodeGoal;
	decorate(node: ParseNodeGoal__0__List):           SemanticStatementType[];
	decorate(node: ParseNode):                        SemanticNode | SemanticNode[];
	decorate(node: ParseNode):                        SemanticNode | SemanticNode[] {
		if (node instanceof ParseNodePrimitiveLiteral) {
			return new SemanticNodeConstant(node.children[0])

		} else if (node instanceof ParseNodeTypeKeyword) {
			return new SemanticNodeTypeConstant(node.children[0])

		} else if (node instanceof ParseNodeTypeUnit) {
			return (node.children.length === 1)
				? (node.children[0] instanceof ParseNodePrimitiveLiteral)
					? new SemanticNodeTypeConstant(node.children[0].children[0])
					: this.decorate(node.children[0])
				: this.decorate(node.children[1])

		} else if (node instanceof ParseNodeTypeUnary) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new SemanticNodeTypeOperationUnary(node, Validator.TYPEOPERATORS_UNARY.get(node.children[1].source as Punctuator)!, [
					this.decorate(node.children[0]),
				])

		} else if (node instanceof ParseNodeTypeBinary) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new SemanticNodeTypeOperationBinary(node, Validator.TYPEOPERATORS_BINARY.get(node.children[1].source as Punctuator)!, [
					this.decorate(node.children[0]),
					// @ts-expect-error
					this.decorate(node.children[2]),
				])

		} else if (node instanceof ParseNodeType) {
			return this.decorate(node.children[0])

		} else if (node instanceof ParseNodeStringTemplate) {
			return new SemanticNodeTemplate(node, (node.children as readonly (TokenTemplate | ParseNodeExpression | ParseNodeStringTemplate__0__List)[]).flatMap((c) =>
				c instanceof Token ? [new SemanticNodeConstant(c)] :
				c instanceof ParseNodeExpression ? [this.decorate(c)] :
				this.decorate(c)
			))

		} else if (node instanceof ParseNodeStringTemplate__0__List) {
			return (node.children as readonly (TokenTemplate | ParseNodeExpression | ParseNodeStringTemplate__0__List)[]).flatMap((c) =>
				c instanceof Token ? [new SemanticNodeConstant(c)] :
				c instanceof ParseNodeExpression ? [this.decorate(c)] :
				this.decorate(c)
			)

		} else if (node instanceof ParseNodeExpressionUnit) {
			return (node.children.length === 1)
				? (node.children[0] instanceof ParseNode)
					? this.decorate(node.children[0])
					: new SemanticNodeIdentifier(node.children[0])
				: this.decorate(node.children[1])

		} else if (node instanceof ParseNodeExpressionUnary) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: (node.children[0].source === Punctuator.AFF) // `+a` is a no-op
					? this.decorate(node.children[1])
					: new SemanticNodeOperationUnary(node, Validator.OPERATORS_UNARY.get(node.children[0].source as Punctuator) as ValidOperatorUnary, [
						this.decorate(node.children[1]),
					])

		} else if (node instanceof ParseNodeExpressionBinary) {
			if (node.children.length === 1) {
				return this.decorate(node.children[0])
			} else {
				const operator: Operator = Validator.OPERATORS_BINARY.get(node.children[1].source as Punctuator | Keyword)!
				const operands: [SemanticNodeExpression, SemanticNodeExpression] = [
					// @ts-expect-error
					this.decorate(node.children[0]),
					this.decorate(node.children[2]),
				]
				return ([
					Operator.EXP,
					Operator.MUL,
					Operator.DIV,
					Operator.ADD,
				].includes(operator)) ?
					new SemanticNodeOperationBinaryArithmetic(node, operator as ValidOperatorArithmetic, operands)
				: (operator === Operator.SUB) ? // `a - b` is syntax sugar for `a + -(b)`
					new SemanticNodeOperationBinaryArithmetic(node, Operator.ADD, [
						operands[0],
						new SemanticNodeOperationUnary(node.children[2], Operator.NEG, [
							operands[1],
						]),
					])
				: ([
					Operator.LT,
					Operator.GT,
					Operator.LE,
					Operator.GE,
				].includes(operator)) ?
					new SemanticNodeOperationBinaryComparative(node, operator as ValidOperatorComparative, operands)
				: (operator === Operator.NLT) ? // `a !< b` is syntax sugar for `!(a < b)`
					new SemanticNodeOperationUnary(node, Operator.NOT, [
						new SemanticNodeOperationBinaryComparative(node.children[0], Operator.LT, operands),
					])
				: (operator === Operator.NGT) ? // `a !> b` is syntax sugar for `!(a > b)`
					new SemanticNodeOperationUnary(node, Operator.NOT, [
						new SemanticNodeOperationBinaryComparative(node.children[0], Operator.GT, operands),
					])
				: ([
					Operator.IS,
					Operator.EQ,
				].includes(operator)) ?
					new SemanticNodeOperationBinaryEquality(node, operator as ValidOperatorEquality, operands)
				: (operator === Operator.ISNT) ? // `a isnt b` is syntax sugar for `!(a is b)`
					new SemanticNodeOperationUnary(node, Operator.NOT, [
						new SemanticNodeOperationBinaryEquality(node.children[0], Operator.IS, operands),
					])
				: (operator === Operator.NEQ) ? // `a != b` is syntax sugar for `!(a == b)`
					new SemanticNodeOperationUnary(node, Operator.NOT, [
						new SemanticNodeOperationBinaryEquality(node.children[0], Operator.EQ, operands),
					])
				: ([
					Operator.AND,
					Operator.OR,
				].includes(operator)) ?
					new SemanticNodeOperationBinaryLogical(node, operator as ValidOperatorLogical, operands)
				: (operator === Operator.NAND) ? // `a !& b` is syntax sugar for `!(a && b)`
					new SemanticNodeOperationUnary(node, Operator.NOT, [
						new SemanticNodeOperationBinaryLogical(node.children[0], Operator.AND, operands),
					])
				: (operator === Operator.NOR) ? // `a !| b` is syntax sugar for `!(a || b)`
					new SemanticNodeOperationUnary(node, Operator.NOT, [
						new SemanticNodeOperationBinaryLogical(node.children[0], Operator.OR, operands),
					])
				: (() => { throw new Error(`Operator ${ Operator[operator] } not found.`) })()
			}

		} else if (node instanceof ParseNodeExpressionConditional) {
			return new SemanticNodeOperationTernary(node, Operator.COND, [
				this.decorate(node.children[1]),
				this.decorate(node.children[3]),
				this.decorate(node.children[5]),
			])

		} else if (node instanceof ParseNodeExpression) {
			return this.decorate(node.children[0])

		} else if (node instanceof ParseNodeDeclarationVariable) {
			const identifier: TokenIdentifier     = (node.children.length === 7) ? node.children[1] : node.children[2]
			const type_:      ParseNodeType       = (node.children.length === 7) ? node.children[3] : node.children[4]
			const expression: ParseNodeExpression = (node.children.length === 7) ? node.children[5] : node.children[6]
			return new SemanticNodeDeclarationVariable(node, node.children.length === 8, [
				new SemanticNodeAssignee(identifier, [
					new SemanticNodeIdentifier(identifier),
				]),
				this.decorate(type_),
				this.decorate(expression),
			])

		} else if (node instanceof ParseNodeStatementAssignment) {
			const identifier: TokenIdentifier     = node.children[0]
			const expression: ParseNodeExpression = node.children[2]
			return new SemanticNodeAssignment(node, [
				new SemanticNodeAssignee(identifier, [
					new SemanticNodeIdentifier(identifier),
				]),
				this.decorate(expression),
			])

		} else if (node instanceof ParseNodeStatement) {
			return (node.children.length === 1 && node.children[0] instanceof ParseNode)
				? this.decorate(node.children[0])
				: new SemanticNodeStatementExpression(node, (node.children.length === 1) ? [] : [
					this.decorate(node.children[0]),
				])

		} else if (node instanceof ParseNodeGoal) {
			return new SemanticNodeGoal(node, (node.children.length === 2) ? [] : this.decorate(node.children[1]))

		} else if (node instanceof ParseNodeGoal__0__List) {
			return node.children.length === 1 ?
				[this.decorate(node.children[0])]
			: [
				...this.decorate(node.children[0]),
				this.decorate(node.children[1])
			]

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

	/**
	 * Construct a new Builder object from this Validator.
	 * @return a new Builder with this Validator as its argument
	 */
	get builder(): Builder {
		return new Builder(this.validate(), this.config)
	}
}
