import {
	NonemptyArray,
	Token,
	ParseNode,
} from '@chharvey/parser';

import {
	Dev,
} from '../core/index.js';
import {
	Punctuator,
	Keyword,
	TOKEN,
	PARSER,
} from '../parser/index.js';
import {
	Operator,
	ValidAccessOperator,
	ValidTypeOperator,
	ValidOperatorUnary,
	ValidOperatorArithmetic,
	ValidOperatorComparative,
	ValidOperatorEquality,
	ValidOperatorLogical,
} from './Operator.js';
import type {ASTNodeSolid} from './ASTNode.js';
import * as AST from './ASTNode.js';



type ParseList<T extends ParseNode> = ParseNode & {
	children:
		| readonly [T]
		| readonly [ParseList<T>, T]
	,
};
type HashList<T extends ParseNode> = ParseNode & {
	children:
		| readonly [T]
		| readonly [HashList<T>, Token, T]
	,
};



type TemplatePartialType = // FIXME spread types
	| [                        AST.ASTNodeConstant                       ]
	| [                        AST.ASTNodeConstant, AST.ASTNodeExpression]
	// | [...TemplatePartialType, AST.ASTNodeConstant                       ]
	// | [...TemplatePartialType, AST.ASTNodeConstant, AST.ASTNodeExpression]
	| AST.ASTNodeExpression[]
;



export class Decorator {
	private static readonly ACCESSORS: ReadonlyMap<Punctuator, ValidAccessOperator> = new Map<Punctuator, ValidAccessOperator>([
		[Punctuator.DOT,      Operator.DOT],
		[Punctuator.OPTDOT,   Operator.OPTDOT],
		[Punctuator.CLAIMDOT, Operator.CLAIMDOT],
	]);
	private static readonly TYPEOPERATORS_UNARY: ReadonlyMap<Punctuator, ValidTypeOperator> = new Map<Punctuator, ValidTypeOperator>([
		[Punctuator.ORNULL, Operator.ORNULL],
		[Punctuator.OREXCP, Operator.OREXCP],
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
		[Punctuator.ID,   Operator.ID],
		[Punctuator.NID,  Operator.NID],
		[Punctuator.EQ,   Operator.EQ],
		[Punctuator.NEQ,  Operator.NEQ],
		[Punctuator.AND,  Operator.AND],
		[Punctuator.NAND, Operator.NAND],
		[Punctuator.OR,   Operator.OR],
		[Punctuator.NOR,  Operator.NOR],
	])

	/**
	 * Decorate a list.
	 * @typeParam T - the type of ParseNode in the list
	 * @typeParam A - the ASTNode that is returned by decoration
	 * @return a sequence of `A` nodes.
	 */
	private static parseList<T extends ParseNode, A extends ASTNodeSolid>(node: ParseList<T> | HashList<T>): NonemptyArray<A> {
		return (node.children.length === 1)
			? [this.decorate(node.children[0]) as A]
			: [
				...this.parseList<T, A>(node.children[0]) as NonemptyArray<A>,
				this.decorate((node.children.length === 2) ? node.children[1] : node.children[2]) as A,
			];
	}

	/**
	 * Return an ASTNode corresponding to a ParseNode’s contents.
	 * @param node the parse node to decorate
	 * @returns an ASTNode
	 */
	static decorate(node: PARSER.ParseNodeWord):             AST.ASTNodeKey;
	static decorate(node: PARSER.ParseNodePrimitiveLiteral): AST.ASTNodeConstant;
	static decorate(node: PARSER.ParseNodeTypeKeyword):      AST.ASTNodeTypeConstant;
	static decorate(node:
		| PARSER.ParseNodeEntryType
		| PARSER.ParseNodeEntryType_Optional
	): AST.ASTNodeItemType;
	static decorate(node:
		| PARSER.ParseNodeEntryType_Named
		| PARSER.ParseNodeEntryType_Named_Optional
	): AST.ASTNodePropertyType;
	static decorate(node: PARSER.ParseNodeItemsType):          NonemptyArray<AST.ASTNodeItemType>;
	static decorate(node: PARSER.ParseNodePropertiesType):     NonemptyArray<AST.ASTNodePropertyType>;
	static decorate(node: PARSER.ParseNodeTypeTupleLiteral):   AST.ASTNodeTypeTuple;
	static decorate(node: PARSER.ParseNodeTypeRecordLiteral):  AST.ASTNodeTypeRecord;
	static decorate(node: PARSER.ParseNodeTypeHashLiteral):    AST.ASTNodeTypeHash;
	static decorate(node: PARSER.ParseNodeTypeMapLiteral):     AST.ASTNodeTypeMap;
	static decorate(node: PARSER.ParseNodeGenericArguments):   NonemptyArray<AST.ASTNodeType>;
	static decorate(node: PARSER.ParseNodePropertyAccessType): AST.ASTNodeIndexType | AST.ASTNodeKey;
	static decorate(node: PARSER.ParseNodeGenericCall):        NonemptyArray<AST.ASTNodeType>;
	static decorate(node:
		| PARSER.ParseNodeTypeUnit
		| PARSER.ParseNodeTypeCompound
		| PARSER.ParseNodeTypeUnarySymbol
		| PARSER.ParseNodeTypeIntersection
		| PARSER.ParseNodeTypeUnion
		| PARSER.ParseNodeType
	): AST.ASTNodeType;
	static decorate(node: PARSER.ParseNodeStringTemplate):          AST.ASTNodeTemplate;
	static decorate(node: PARSER.ParseNodeStringTemplate__0__List): TemplatePartialType;
	static decorate(node: PARSER.ParseNodeProperty):                AST.ASTNodeProperty;
	static decorate(node: PARSER.ParseNodeCase):                    AST.ASTNodeCase;
	static decorate(node: PARSER.ParseNodeTupleLiteral):            AST.ASTNodeTuple;
	static decorate(node: PARSER.ParseNodeRecordLiteral):           AST.ASTNodeRecord;
	static decorate(node: PARSER.ParseNodeSetLiteral):              AST.ASTNodeSet;
	static decorate(node: PARSER.ParseNodeMapLiteral):              AST.ASTNodeMapping;
	static decorate(node: PARSER.ParseNodePropertyAccess):          AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression;
	static decorate(node:
		| PARSER.ParseNodeExpressionUnit
		| PARSER.ParseNodeExpressionCompound
		| PARSER.ParseNodeExpressionUnarySymbol
		| PARSER.ParseNodeExpressionExponential
		| PARSER.ParseNodeExpressionMultiplicative
		| PARSER.ParseNodeExpressionAdditive
		| PARSER.ParseNodeExpressionComparative
		| PARSER.ParseNodeExpressionEquality
		| PARSER.ParseNodeExpressionConjunctive
		| PARSER.ParseNodeExpressionDisjunctive
		| PARSER.ParseNodeExpression
	): AST.ASTNodeExpression;
	static decorate(node: PARSER.ParseNodeExpressionConditional): AST.ASTNodeOperationTernary;
	static decorate(node: PARSER.ParseNodeDeclarationType):       AST.ASTNodeDeclarationType;
	static decorate(node: PARSER.ParseNodeDeclarationVariable):   AST.ASTNodeDeclarationVariable;
	static decorate(node: PARSER.ParseNodeDeclaration):           AST.ASTNodeDeclaration;
	static decorate(node: PARSER.ParseNodeAssignee):              AST.ASTNodeVariable;
	static decorate(node: PARSER.ParseNodeStatementAssignment):   AST.ASTNodeAssignment;
	static decorate(node: PARSER.ParseNodeStatement):             AST.ASTNodeStatement;
	static decorate(node: PARSER.ParseNodeGoal):                  AST.ASTNodeGoal;
	static decorate(node: ParseNode): ASTNodeSolid | ASTNodeSolid[];
	static decorate(node: ParseNode): ASTNodeSolid | ASTNodeSolid[] {
		if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeWord) {
			return new AST.ASTNodeKey(node.children[0] as TOKEN.TokenKeyword | TOKEN.TokenIdentifier);

		} else if (node instanceof PARSER.ParseNodePrimitiveLiteral) {
			return new AST.ASTNodeConstant(node.children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString);

		} else if (node instanceof PARSER.ParseNodeTypeKeyword) {
			return new AST.ASTNodeTypeConstant(node.children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString);

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeEntryType) {
			return new AST.ASTNodeItemType(
				node,
				false,
				this.decorate(node.children[0]),
			);

		} else if (Dev.supports('optionalEntries') && node instanceof PARSER.ParseNodeEntryType_Optional) {
			return new AST.ASTNodeItemType(
				node,
				true,
				this.decorate(node.children[1]),
			);

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeEntryType_Named) {
			return new AST.ASTNodePropertyType(
				node,
				false,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (Dev.supports('optionalEntries') && node instanceof PARSER.ParseNodeEntryType_Named_Optional) {
			return new AST.ASTNodePropertyType(
				node,
				true,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeItemsType) {
			return (node.children.length <= 2)
				? this.parseList<PARSER.ParseNodeEntryType | PARSER.ParseNodeEntryType_Optional, AST.ASTNodeItemType>(node.children[0])
				: [
					...this.parseList<PARSER.ParseNodeEntryType,          AST.ASTNodeItemType>(node.children[0] as PARSER.ParseNodeItemsType__0__List),
					...this.parseList<PARSER.ParseNodeEntryType_Optional, AST.ASTNodeItemType>(node.children[2]!),
				];

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodePropertiesType) {
			return this.parseList<PARSER.ParseNodeEntryType_Named | PARSER.ParseNodeEntryType_Named_Optional, AST.ASTNodePropertyType>(node.children[0]);

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeTypeTupleLiteral) {
			return new AST.ASTNodeTypeTuple(node, (node.children.length === 2) ? [] : this.decorate(
				node.children.find((c): c is PARSER.ParseNodeItemsType => c instanceof PARSER.ParseNodeItemsType)!
			));

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeTypeRecordLiteral) {
			return new AST.ASTNodeTypeRecord(node, this.decorate(
				node.children.find((c): c is PARSER.ParseNodePropertiesType => c instanceof PARSER.ParseNodePropertiesType)!
			));

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeTypeHashLiteral) {
			return new AST.ASTNodeTypeHash(node, this.decorate(node.children[2]));

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeTypeMapLiteral) {
			return new AST.ASTNodeTypeMap(node, this.decorate(node.children[1]), this.decorate(node.children[3]));

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeGenericArguments) {
			return this.parseList<PARSER.ParseNodeType, AST.ASTNodeType>(
				node.children.find((c): c is PARSER.ParseNodeGenericArguments__0__List => c instanceof PARSER.ParseNodeGenericArguments__0__List)!
			);

		} else if (node instanceof PARSER.ParseNodeTypeUnit) {
			return (node.children.length === 1)
				? (node.children[0] instanceof ParseNode)
					? (node.children[0] instanceof PARSER.ParseNodePrimitiveLiteral)
						? new AST.ASTNodeTypeConstant(node.children[0].children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString)
						: this.decorate(node.children[0])
					: new AST.ASTNodeTypeAlias(node.children[0] as TOKEN.TokenIdentifier)
				: this.decorate(node.children[1]);

		} else if (node instanceof PARSER.ParseNodePropertyAccessType) {
			return (
				(node.children[1] instanceof TOKEN.TokenNumber) ? new AST.ASTNodeIndexType(node, new AST.ASTNodeTypeConstant(node.children[1])) :
				this.decorate(node.children[1] as PARSER.ParseNodeWord)
			);

		} else if (node instanceof PARSER.ParseNodeGenericCall) {
			return this.decorate(node.children[1]);

		} else if (node instanceof PARSER.ParseNodeTypeCompound) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: (node.children[1] instanceof PARSER.ParseNodePropertyAccessType)
					? new AST.ASTNodeTypeAccess(node, this.decorate(node.children[0]), this.decorate(node.children[1]))
					: new AST.ASTNodeTypeCall  (node, this.decorate(node.children[0]), this.decorate(node.children[1]));

		} else if (node instanceof PARSER.ParseNodeTypeUnarySymbol) {
			return (
				(node.children.length === 1) ? this.decorate(node.children[0]) :
				(node.children.length === 2) ? new AST.ASTNodeTypeOperationUnary(
					node,
					this.TYPEOPERATORS_UNARY.get(node.children[1].source as Punctuator)!,
					this.decorate(node.children[0]),
				) :
				(node.children[1].source === Punctuator.BRAK_OPN)
					? new AST.ASTNodeTypeList(
						node,
						this.decorate(node.children[0]),
						(node.children[2].source === Punctuator.BRAK_CLS) ? null : BigInt((node.children[2] as TOKEN.TokenNumber).cook())
					)
					: new AST.ASTNodeTypeSet(node, this.decorate(node.children[0]))
			);

		} else if (
			node instanceof PARSER.ParseNodeTypeIntersection ||
			node instanceof PARSER.ParseNodeTypeUnion
		) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new AST.ASTNodeTypeOperationBinary(
					node,
					this.TYPEOPERATORS_BINARY.get(node.children[1].source as Punctuator)!,
					this.decorate(node.children[0]),
					this.decorate(node.children[2]),
				);

		} else if (node instanceof PARSER.ParseNodeType) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSER.ParseNodeStringTemplate) {
			return new AST.ASTNodeTemplate(node, [...node.children].flatMap((c) =>
				(c instanceof TOKEN.TokenTemplate) ? [new AST.ASTNodeConstant(c)] :
				(c instanceof PARSER.ParseNodeExpression) ? [this.decorate(c)] :
				this.decorate(c as PARSER.ParseNodeStringTemplate__0__List)
			));

		} else if (node instanceof PARSER.ParseNodeStringTemplate__0__List) {
			return [...node.children].flatMap((c) =>
				(c instanceof TOKEN.TokenTemplate) ? [new AST.ASTNodeConstant(c)] :
				(c instanceof PARSER.ParseNodeExpression) ? [this.decorate(c)] :
				this.decorate(c as PARSER.ParseNodeStringTemplate__0__List)
			);

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeProperty) {
			return new AST.ASTNodeProperty(
				node,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeCase) {
			return new AST.ASTNodeCase(
				node,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeTupleLiteral) {
			return new AST.ASTNodeTuple(node, (node.children.length === 2) ? [] : this.parseList<PARSER.ParseNodeExpression, AST.ASTNodeExpression>(
				node.children.find((c): c is PARSER.ParseNodeTupleLiteral__0__List => c instanceof PARSER.ParseNodeTupleLiteral__0__List)!,
			));

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeRecordLiteral) {
			return new AST.ASTNodeRecord(node, this.parseList<PARSER.ParseNodeProperty, AST.ASTNodeProperty>(
				node.children.find((c): c is PARSER.ParseNodeRecordLiteral__0__List => c instanceof PARSER.ParseNodeRecordLiteral__0__List)!,
			));

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeSetLiteral) {
			return new AST.ASTNodeSet(node, (node.children.length === 2) ? [] : this.parseList<PARSER.ParseNodeExpression, AST.ASTNodeExpression>(
				node.children.find((c): c is PARSER.ParseNodeTupleLiteral__0__List => c instanceof PARSER.ParseNodeTupleLiteral__0__List)!,
			));

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeMapLiteral) {
			return new AST.ASTNodeMapping(node, this.parseList<PARSER.ParseNodeCase, AST.ASTNodeCase>(
				node.children.find((c): c is PARSER.ParseNodeMapLiteral__0__List => c instanceof PARSER.ParseNodeMapLiteral__0__List)!,
			));

		} else if (node instanceof PARSER.ParseNodeExpressionUnit) {
			return (node.children.length === 1)
				? (node.children[0] instanceof ParseNode)
					? this.decorate(node.children[0])
					: new AST.ASTNodeVariable(node.children[0] as TOKEN.TokenIdentifier)
				: this.decorate(node.children[1]);

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodePropertyAccess) {
			return (
				(node.children[1] instanceof TOKEN.TokenNumber) ? new AST.ASTNodeIndex(node, new AST.ASTNodeConstant(node.children[1])) :
				(node.children[1] instanceof PARSER.ParseNodeWord) ? this.decorate(node.children[1]) :
				this.decorate(node.children[2]!)
			);

		} else if (Dev.supports('literalCollection') && node instanceof PARSER.ParseNodeExpressionCompound) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new AST.ASTNodeAccess(
					node,
					this.ACCESSORS.get(node.children[1].children[0].source as Punctuator)!,
					this.decorate(node.children[0]),
					this.decorate(node.children[1]),
				);

		} else if (node instanceof PARSER.ParseNodeExpressionUnarySymbol) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: (node.children[0].source === Punctuator.AFF) // `+a` is a no-op
					? this.decorate(node.children[1])
					: new AST.ASTNodeOperationUnary(
						node,
						this.OPERATORS_UNARY.get(node.children[0].source as Punctuator) as ValidOperatorUnary,
						this.decorate(node.children[1]),
					);

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
				const operands: [AST.ASTNodeExpression, AST.ASTNodeExpression] = [
					this.decorate(node.children[0]),
					this.decorate(node.children[2]),
				];
				return (
					node instanceof PARSER.ParseNodeExpressionExponential    ||
					node instanceof PARSER.ParseNodeExpressionMultiplicative ||
					node instanceof PARSER.ParseNodeExpressionAdditive
				) ? (
					// `a - b` is syntax sugar for `a + -(b)`
					(operator === Operator.SUB) ? new AST.ASTNodeOperationBinaryArithmetic(
						node,
						Operator.ADD,
						operands[0],
						new AST.ASTNodeOperationUnary(
							node.children[2],
							Operator.NEG,
							operands[1],
						),
					) :
					new AST.ASTNodeOperationBinaryArithmetic(node, operator as ValidOperatorArithmetic, ...operands)

				) : (node instanceof PARSER.ParseNodeExpressionComparative) ? (
					// `a !< b` is syntax sugar for `!(a < b)`
					(operator === Operator.NLT) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryComparative(node.children[0], Operator.LT, ...operands),
					) :
					// `a !> b` is syntax sugar for `!(a > b)`
					(operator === Operator.NGT) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryComparative(node.children[0], Operator.GT, ...operands),
					) :
					// `a isnt b` is syntax sugar for `!(a is b)`
					(operator === Operator.ISNT) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryComparative(node.children[0], Operator.IS, ...operands),
					) :
					new AST.ASTNodeOperationBinaryComparative(node, operator as ValidOperatorComparative, ...operands)

				) : (node instanceof PARSER.ParseNodeExpressionEquality) ? (
					// `a !== b` is syntax sugar for `!(a === b)`
					(operator === Operator.NID) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryEquality(node.children[0], Operator.ID, ...operands),
					) :
					// `a != b` is syntax sugar for `!(a == b)`
					(operator === Operator.NEQ) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryEquality(node.children[0], Operator.EQ, ...operands),
					) :
					new AST.ASTNodeOperationBinaryEquality(node, operator as ValidOperatorEquality, ...operands)

				) : /* (
					node instanceof PARSER.ParseNodeExpressionConjunctive ||
					node instanceof PARSER.ParseNodeExpressionDisjunctive
				) ? */ (
					// `a !& b` is syntax sugar for `!(a && b)`
					(operator === Operator.NAND) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryLogical(node.children[0], Operator.AND, ...operands),
					) :
					// `a !| b` is syntax sugar for `!(a || b)`
					(operator === Operator.NOR) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryLogical(node.children[0], Operator.OR, ...operands),
					) :
					new AST.ASTNodeOperationBinaryLogical(node, operator as ValidOperatorLogical, ...operands)
				)
			}

		} else if (node instanceof PARSER.ParseNodeExpressionConditional) {
			return new AST.ASTNodeOperationTernary(
				node,
				Operator.COND,
				this.decorate(node.children[1]),
				this.decorate(node.children[3]),
				this.decorate(node.children[5]),
			);

		} else if (node instanceof PARSER.ParseNodeExpression) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSER.ParseNodeDeclarationType) {
			return new AST.ASTNodeDeclarationType(
				node,
				new AST.ASTNodeTypeAlias(node.children[1] as TOKEN.TokenIdentifier),
				this.decorate(node.children[3]),
			);

		} else if (node instanceof PARSER.ParseNodeDeclarationVariable) {
			return new AST.ASTNodeDeclarationVariable(
				node,
				node.children.length === 8,
				new AST.ASTNodeVariable(((node.children.length === 7) ? node.children[1] : node.children[2]) as TOKEN.TokenIdentifier),
				this.decorate((node.children.length === 7) ? node.children[3] : node.children[4]),
				this.decorate((node.children.length === 7) ? node.children[5] : node.children[6]),
			);

		} else if (node instanceof PARSER.ParseNodeDeclaration) {
			return this.decorate(node.children[0]);

		} else if (node instanceof PARSER.ParseNodeAssignee) {
			return new AST.ASTNodeVariable(node.children[0] as TOKEN.TokenIdentifier);

		} else if (node instanceof PARSER.ParseNodeStatementAssignment) {
			return new AST.ASTNodeAssignment(
				node,
				this.decorate(node.children[0]) as AST.ASTNodeVariable,
				this.decorate(node.children[2]),
			);

		} else if (node instanceof PARSER.ParseNodeStatement) {
			return (node.children.length === 1 && node.children[0] instanceof ParseNode)
				? this.decorate(node.children[0])
				: new AST.ASTNodeStatementExpression(node, (node.children.length === 2) ? this.decorate(node.children[0]) : void 0);

		} else if (node instanceof PARSER.ParseNodeGoal) {
			return new AST.ASTNodeGoal(node, (node.children.length === 2) ? [] : this.parseList<PARSER.ParseNodeStatement, AST.ASTNodeStatement>(node.children[1]));
		}
		throw new TypeError(`Could not find type of parse node \`${ node.constructor.name }\`.`);
	}
}
