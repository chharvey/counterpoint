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
	PARSENODE,
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
};
type HashList<T extends ParseNode> = ParseNode & {
	children:
		| readonly [T]
		| readonly [HashList<T>, Token, T],
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
				...this.decorate(node.children[0]) as NonemptyArray<A>,
				this.decorate((node.children.length === 2) ? node.children[1] : node.children[2]) as A,
			];
	}

	/**
	 * Return an ASTNode corresponding to a ParseNode’s contents.
	 * @param node the parse node to decorate
	 * @returns an ASTNode
	 */
	static decorate(node: PARSENODE.ParseNodeWord):             AST.ASTNodeKey;
	static decorate(node: PARSENODE.ParseNodePrimitiveLiteral): AST.ASTNodeConstant;
	static decorate(node: PARSENODE.ParseNodeTypeKeyword):      AST.ASTNodeTypeConstant;
	static decorate(node:
		| PARSENODE.ParseNodeEntryType
		| PARSENODE.ParseNodeEntryType_Optional
	): AST.ASTNodeItemType;
	static decorate(node:
		| PARSENODE.ParseNodeEntryType_Named
		| PARSENODE.ParseNodeEntryType_Named_Optional
	): AST.ASTNodePropertyType;
	static decorate(node:
		| PARSENODE.ParseNodeItemsType
		| PARSENODE.ParseNodeItemsType__0__List
		| PARSENODE.ParseNodeItemsType__1__List
	): NonemptyArray<AST.ASTNodeItemType>;
	static decorate(node:
		| PARSENODE.ParseNodePropertiesType
		| PARSENODE.ParseNodePropertiesType__0__List
	): NonemptyArray<AST.ASTNodePropertyType>;
	static decorate(node: PARSENODE.ParseNodeTypeTupleLiteral):   AST.ASTNodeTypeTuple;
	static decorate(node: PARSENODE.ParseNodeTypeRecordLiteral):  AST.ASTNodeTypeRecord;
	static decorate(node: PARSENODE.ParseNodePropertyAccessType): AST.ASTNodeIndexType | AST.ASTNodeKey;
	static decorate(node:
		| PARSENODE.ParseNodeTypeUnit
		| PARSENODE.ParseNodeTypeCompound
		| PARSENODE.ParseNodeTypeUnarySymbol
		| PARSENODE.ParseNodeTypeIntersection
		| PARSENODE.ParseNodeTypeUnion
		| PARSENODE.ParseNodeType
	): AST.ASTNodeType;
	static decorate(node: PARSENODE.ParseNodeStringTemplate):          AST.ASTNodeTemplate;
	static decorate(node: PARSENODE.ParseNodeStringTemplate__0__List): TemplatePartialType;
	static decorate(node: PARSENODE.ParseNodeProperty):                AST.ASTNodeProperty;
	static decorate(node: PARSENODE.ParseNodeCase):                    AST.ASTNodeCase;
	static decorate(node: PARSENODE.ParseNodeTupleLiteral):            AST.ASTNodeTuple;
	static decorate(node: PARSENODE.ParseNodeTupleLiteral__0__List):   AST.ASTNodeExpression[];
	static decorate(node: PARSENODE.ParseNodeRecordLiteral):           AST.ASTNodeRecord;
	static decorate(node: PARSENODE.ParseNodeRecordLiteral__0__List):  NonemptyArray<AST.ASTNodeProperty>;
	static decorate(node: PARSENODE.ParseNodeSetLiteral):              AST.ASTNodeSet;
	static decorate(node: PARSENODE.ParseNodeMappingLiteral):          AST.ASTNodeMapping;
	static decorate(node: PARSENODE.ParseNodeMappingLiteral__0__List): NonemptyArray<AST.ASTNodeCase>;
	static decorate(node: PARSENODE.ParseNodePropertyAccess):          AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression;
	static decorate(node:
		| PARSENODE.ParseNodeExpressionUnit
		| PARSENODE.ParseNodeExpressionCompound
		| PARSENODE.ParseNodeExpressionUnarySymbol
		| PARSENODE.ParseNodeExpressionExponential
		| PARSENODE.ParseNodeExpressionMultiplicative
		| PARSENODE.ParseNodeExpressionAdditive
		| PARSENODE.ParseNodeExpressionComparative
		| PARSENODE.ParseNodeExpressionEquality
		| PARSENODE.ParseNodeExpressionConjunctive
		| PARSENODE.ParseNodeExpressionDisjunctive
		| PARSENODE.ParseNodeExpression
	): AST.ASTNodeExpression;
	static decorate(node: PARSENODE.ParseNodeExpressionConditional): AST.ASTNodeOperationTernary;
	static decorate(node: PARSENODE.ParseNodeDeclarationType):       AST.ASTNodeDeclarationType;
	static decorate(node: PARSENODE.ParseNodeDeclarationVariable):   AST.ASTNodeDeclarationVariable;
	static decorate(node: PARSENODE.ParseNodeDeclaration):           AST.ASTNodeDeclaration;
	static decorate(node: PARSENODE.ParseNodeAssignee):              AST.ASTNodeVariable;
	static decorate(node: PARSENODE.ParseNodeStatementAssignment):   AST.ASTNodeAssignment;
	static decorate(node: PARSENODE.ParseNodeStatement):             AST.ASTNodeStatement;
	static decorate(node: PARSENODE.ParseNodeGoal__0__List):         AST.ASTNodeStatement[];
	static decorate(node: PARSENODE.ParseNodeGoal):                  AST.ASTNodeGoal;
	static decorate(node: ParseNode): ASTNodeSolid | ASTNodeSolid[];
	static decorate(node: ParseNode): ASTNodeSolid | ASTNodeSolid[] {
		if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeWord) {
			return new AST.ASTNodeKey(node.children[0] as TOKEN.TokenKeyword | TOKEN.TokenIdentifier);

		} else if (node instanceof PARSENODE.ParseNodePrimitiveLiteral) {
			return new AST.ASTNodeConstant(node.children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString);

		} else if (node instanceof PARSENODE.ParseNodeTypeKeyword) {
			return new AST.ASTNodeTypeConstant(node.children[0] as TOKEN.TokenKeyword);

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeEntryType) {
			return new AST.ASTNodeItemType(
				node,
				false,
				this.decorate(node.children[0]),
			);

		} else if (Dev.supports('optionalEntries') && node instanceof PARSENODE.ParseNodeEntryType_Optional) {
			return new AST.ASTNodeItemType(
				node,
				true,
				this.decorate(node.children[1]),
			);

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeEntryType_Named) {
			return new AST.ASTNodePropertyType(
				node,
				false,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (Dev.supports('optionalEntries') && node instanceof PARSENODE.ParseNodeEntryType_Named_Optional) {
			return new AST.ASTNodePropertyType(
				node,
				true,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeItemsType) {
			return (node.children.length <= 2)
				? this.decorate(node.children[0])
				: [
					...this.decorate(node.children[0]),
					...this.decorate(node.children[2]!),
				];

		} else if (Dev.supports('literalCollection') && (
			   node instanceof PARSENODE.ParseNodeItemsType__0__List
			|| node instanceof PARSENODE.ParseNodeItemsType__1__List
		)) {
			return this.parseList<PARSENODE.ParseNodeEntryType | PARSENODE.ParseNodeEntryType_Optional, AST.ASTNodeItemType>(node);

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodePropertiesType) {
			return this.decorate(node.children[0]);

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodePropertiesType__0__List) {
			return this.parseList<PARSENODE.ParseNodeEntryType_Named, AST.ASTNodePropertyType>(node);

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeTypeTupleLiteral) {
			return new AST.ASTNodeTypeTuple(node, (node.children.length === 2) ? [] : this.decorate(
				node.children.find((c): c is PARSENODE.ParseNodeItemsType => c instanceof PARSENODE.ParseNodeItemsType)!
			));

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeTypeRecordLiteral) {
			return new AST.ASTNodeTypeRecord(node, this.decorate(
				node.children.find((c): c is PARSENODE.ParseNodePropertiesType => c instanceof PARSENODE.ParseNodePropertiesType)!
			));

		} else if (node instanceof PARSENODE.ParseNodeTypeUnit) {
			return (node.children.length === 1)
				? (node.children[0] instanceof ParseNode)
					? (node.children[0] instanceof PARSENODE.ParseNodePrimitiveLiteral)
						? new AST.ASTNodeTypeConstant(node.children[0].children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString)
						: this.decorate(node.children[0])
					: new AST.ASTNodeTypeAlias(node.children[0] as TOKEN.TokenIdentifier)
				: this.decorate(node.children[1]);

		} else if (node instanceof PARSENODE.ParseNodePropertyAccessType) {
			return (
				(node.children[1] instanceof TOKEN.TokenNumber) ? new AST.ASTNodeIndexType(node, new AST.ASTNodeTypeConstant(node.children[1])) :
				this.decorate(node.children[1] as PARSENODE.ParseNodeWord)
			);

		} else if (node instanceof PARSENODE.ParseNodeTypeCompound) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new AST.ASTNodeTypeAccess(
					node,
					this.decorate(node.children[0]),
					this.decorate(node.children[1]),
				);

		} else if (node instanceof PARSENODE.ParseNodeTypeUnarySymbol) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new AST.ASTNodeTypeOperationUnary(
					node,
					this.TYPEOPERATORS_UNARY.get(node.children[1].source as Punctuator)!,
					this.decorate(node.children[0]),
				);

		} else if (
			node instanceof PARSENODE.ParseNodeTypeIntersection ||
			node instanceof PARSENODE.ParseNodeTypeUnion
		) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new AST.ASTNodeTypeOperationBinary(
					node,
					this.TYPEOPERATORS_BINARY.get(node.children[1].source as Punctuator)!,
					this.decorate(node.children[0]),
					this.decorate(node.children[2]),
				);

		} else if (node instanceof PARSENODE.ParseNodeType) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSENODE.ParseNodeStringTemplate) {
			return new AST.ASTNodeTemplate(node, [...node.children].flatMap((c) =>
				(c instanceof TOKEN.TokenTemplate) ? [new AST.ASTNodeConstant(c)] :
				(c instanceof PARSENODE.ParseNodeExpression) ? [this.decorate(c)] :
				this.decorate(c as PARSENODE.ParseNodeStringTemplate__0__List)
			));

		} else if (node instanceof PARSENODE.ParseNodeStringTemplate__0__List) {
			return [...node.children].flatMap((c) =>
				(c instanceof TOKEN.TokenTemplate) ? [new AST.ASTNodeConstant(c)] :
				(c instanceof PARSENODE.ParseNodeExpression) ? [this.decorate(c)] :
				this.decorate(c as PARSENODE.ParseNodeStringTemplate__0__List)
			);

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeProperty) {
			return new AST.ASTNodeProperty(
				node,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeCase) {
			return new AST.ASTNodeCase(
				node,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeTupleLiteral) {
			return new AST.ASTNodeTuple(node, (node.children.length === 2) ? [] : this.decorate(
				node.children.find((c): c is PARSENODE.ParseNodeTupleLiteral__0__List => c instanceof PARSENODE.ParseNodeTupleLiteral__0__List)!,
			));

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeTupleLiteral__0__List) {
			return this.parseList<PARSENODE.ParseNodeExpression, AST.ASTNodeExpression>(node);

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeRecordLiteral) {
			return new AST.ASTNodeRecord(node, this.decorate(
				node.children.find((c): c is PARSENODE.ParseNodeRecordLiteral__0__List => c instanceof PARSENODE.ParseNodeRecordLiteral__0__List)!,
			));

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeSetLiteral) {
			return new AST.ASTNodeSet(node, (node.children.length === 2) ? [] : this.decorate(
				node.children.find((c): c is PARSENODE.ParseNodeTupleLiteral__0__List => c instanceof PARSENODE.ParseNodeTupleLiteral__0__List)!,
			));

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeRecordLiteral__0__List) {
			return this.parseList<PARSENODE.ParseNodeProperty, AST.ASTNodeProperty>(node);

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeMappingLiteral) {
			return new AST.ASTNodeMapping(node, this.decorate(
				node.children.find((c): c is PARSENODE.ParseNodeMappingLiteral__0__List => c instanceof PARSENODE.ParseNodeMappingLiteral__0__List)!,
			));

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeMappingLiteral__0__List) {
			return this.parseList<PARSENODE.ParseNodeCase, AST.ASTNodeCase>(node);

		} else if (node instanceof PARSENODE.ParseNodeExpressionUnit) {
			return (node.children.length === 1)
				? (node.children[0] instanceof ParseNode)
					? this.decorate(node.children[0])
					: new AST.ASTNodeVariable(node.children[0] as TOKEN.TokenIdentifier)
				: this.decorate(node.children[1]);

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodePropertyAccess) {
			return (
				(node.children[1] instanceof TOKEN.TokenNumber) ? new AST.ASTNodeIndex(node, new AST.ASTNodeConstant(node.children[1])) :
				(node.children[1] instanceof PARSENODE.ParseNodeWord) ? this.decorate(node.children[1]) :
				this.decorate(node.children[2]!)
			);

		} else if (Dev.supports('literalCollection') && node instanceof PARSENODE.ParseNodeExpressionCompound) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new AST.ASTNodeAccess(
					node,
					this.ACCESSORS.get(node.children[1].children[0].source as Punctuator)!,
					this.decorate(node.children[0]),
					this.decorate(node.children[1]),
				);

		} else if (node instanceof PARSENODE.ParseNodeExpressionUnarySymbol) {
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
			node instanceof PARSENODE.ParseNodeExpressionExponential    ||
			node instanceof PARSENODE.ParseNodeExpressionMultiplicative ||
			node instanceof PARSENODE.ParseNodeExpressionAdditive       ||
			node instanceof PARSENODE.ParseNodeExpressionComparative    ||
			node instanceof PARSENODE.ParseNodeExpressionEquality       ||
			node instanceof PARSENODE.ParseNodeExpressionConjunctive    ||
			node instanceof PARSENODE.ParseNodeExpressionDisjunctive
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
					node instanceof PARSENODE.ParseNodeExpressionExponential    ||
					node instanceof PARSENODE.ParseNodeExpressionMultiplicative ||
					node instanceof PARSENODE.ParseNodeExpressionAdditive
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

				) : (node instanceof PARSENODE.ParseNodeExpressionComparative) ? (
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

				) : (node instanceof PARSENODE.ParseNodeExpressionEquality) ? (
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

		} else if (node instanceof PARSENODE.ParseNodeExpressionConditional) {
			return new AST.ASTNodeOperationTernary(
				node,
				Operator.COND,
				this.decorate(node.children[1]),
				this.decorate(node.children[3]),
				this.decorate(node.children[5]),
			);

		} else if (node instanceof PARSENODE.ParseNodeExpression) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSENODE.ParseNodeDeclarationType) {
			return new AST.ASTNodeDeclarationType(
				node,
				new AST.ASTNodeTypeAlias(node.children[1] as TOKEN.TokenIdentifier),
				this.decorate(node.children[3]),
			);

		} else if (node instanceof PARSENODE.ParseNodeDeclarationVariable) {
			return new AST.ASTNodeDeclarationVariable(
				node,
				node.children.length === 8,
				new AST.ASTNodeVariable(((node.children.length === 7) ? node.children[1] : node.children[2]) as TOKEN.TokenIdentifier),
				this.decorate((node.children.length === 7) ? node.children[3] : node.children[4]),
				this.decorate((node.children.length === 7) ? node.children[5] : node.children[6]),
			);

		} else if (node instanceof PARSENODE.ParseNodeDeclaration) {
			return this.decorate(node.children[0]);

		} else if (node instanceof PARSENODE.ParseNodeAssignee) {
			return new AST.ASTNodeVariable(node.children[0] as TOKEN.TokenIdentifier);

		} else if (node instanceof PARSENODE.ParseNodeStatementAssignment) {
			return new AST.ASTNodeAssignment(
				node,
				this.decorate(node.children[0]) as AST.ASTNodeVariable,
				this.decorate(node.children[2]),
			);

		} else if (node instanceof PARSENODE.ParseNodeStatement) {
			return (node.children.length === 1 && node.children[0] instanceof ParseNode)
				? this.decorate(node.children[0])
				: new AST.ASTNodeStatementExpression(node, (node.children.length === 2) ? this.decorate(node.children[0]) : void 0);

		} else if (node instanceof PARSENODE.ParseNodeGoal__0__List) {
			return this.parseList<PARSENODE.ParseNodeStatement, AST.ASTNodeStatement>(node);

		} else if (node instanceof PARSENODE.ParseNodeGoal) {
			return new AST.ASTNodeGoal(node, (node.children.length === 2) ? [] : this.decorate(node.children[1]));
		}
		throw new TypeError(`Could not find type of parse node \`${ node.constructor.name }\`.`);
	}
}
