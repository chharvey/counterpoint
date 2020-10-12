import {
	Filebound,
	Token,
	TokenFilebound,
} from '@chharvey/parser';
import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../src/SolidConfig'
import {
	LexerSolid as Lexer,
	Punctuator,
	TokenPunctuator,
	TokenKeyword,
	TokenIdentifier,
	TokenNumber,
	TokenString,
} from '../src/lexer/'
import {
	ParseNodePrimitiveLiteral,
	ParseNodeTypeKeyword,
	ParseNodeTypeUnit,
	ParseNodeTypeUnarySymbol,
	ParseNodeTypeIntersection,
	ParseNodeTypeUnion,
	ParseNodeType,
	ParseNodeStringTemplate,
	ParseNodeExpressionUnit,
	ParseNodeExpressionUnarySymbol,
	ParseNodeExpressionExponential,
	ParseNodeExpressionMultiplicative,
	ParseNodeExpressionAdditive,
	ParseNodeExpressionComparative,
	ParseNodeExpressionEquality,
	ParseNodeExpressionConjunctive,
	ParseNodeExpressionDisjunctive,
	ParseNodeExpressionConditional,
	ParseNodeExpression,
	ParseNodeDeclarationVariable,
	ParseNodeStatementAssignment,
	ParseNodeStatement,
	ParseNodeGoal,
	ParseNodeGoal__0__List,
} from '../src/parser/ParseNode.auto'
import {
	assert_arrayLength,
} from './assert-helpers'



export function tokenLiteralFromTypeString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): TokenKeyword | TokenNumber | TokenString {
	const token: Token = primitiveTypeFromString(typestring, config).children[0]
	assert.ok(
		token instanceof TokenKeyword ||
		token instanceof TokenNumber  ||
		token instanceof TokenString
	, 'token should be a TokenKeyword or TokenNumber or TokenString')
	return token
}
export function tokenKeywordFromTypeString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): TokenKeyword {
	const token: Token = keywordTypeFromString(typestring, config).children[0]
	assert.ok(token instanceof TokenKeyword, 'token should be a TokenKeyword')
	return token
}
export function primitiveTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodePrimitiveLiteral {
	const type_unit: ParseNodeTypeUnit = unitTypeFromString(typestring, config)
	assert_arrayLength(type_unit.children, 1, 'type unit should have 1 child')
	const unit: ParseNodePrimitiveLiteral | ParseNodeTypeKeyword = type_unit.children[0]
	assert.ok(unit instanceof ParseNodePrimitiveLiteral, 'unit should be a ParseNodePrimitiveLiteral')
	return unit
}
export function keywordTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeTypeKeyword {
	const type_unit: ParseNodeTypeUnit = unitTypeFromString(typestring, config)
	assert_arrayLength(type_unit.children, 1, 'type unit should have 1 child')
	const unit: ParseNodePrimitiveLiteral | ParseNodeTypeKeyword = type_unit.children[0]
	assert.ok(unit instanceof ParseNodeTypeKeyword, 'unit should be a ParseNodeTypeKeyword')
	return unit
}
export function unitTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeTypeUnit {
	const type_unary: ParseNodeTypeUnarySymbol = unaryTypeFromString(typestring, config)
	assert_arrayLength(type_unary.children, 1, 'unary type should have 1 child')
	return type_unary.children[0]
}
export function unaryTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeTypeUnarySymbol {
	const type_intersection: ParseNodeTypeIntersection = intersectionTypeFromString(typestring, config)
	assert_arrayLength(type_intersection.children, 1, 'intersection type should have 1 child')
	return type_intersection.children[0]
}
export function intersectionTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeTypeIntersection {
	const type_union: ParseNodeTypeUnion = unionTypeFromString(typestring, config)
	assert_arrayLength(type_union.children, 1, 'union type should have 1 child')
	return type_union.children[0]
}
export function unionTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeTypeUnion {
	return typeFromString(typestring, config).children[0]
}
function typeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeType {
	return typeFromSource(`let x: ${ typestring } = null;`, config)
}
export function tokenLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): TokenKeyword | TokenNumber | TokenString {
	const token: Token = primitiveLiteralFromSource(src, config).children[0]
	assert.ok(
		token instanceof TokenKeyword ||
		token instanceof TokenNumber  ||
		token instanceof TokenString
	, 'token should be a TokenKeyword or TokenNumber or TokenString')
	return token
}
export function tokenIdentifierFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): TokenIdentifier {
	const expression_unit: ParseNodeExpressionUnit = unitExpressionFromSource(src, config)
	assert_arrayLength(expression_unit.children, 1, 'expression unit should have 1 child')
	const unit: Token | ParseNodePrimitiveLiteral | ParseNodeStringTemplate = expression_unit.children[0]
	assert.ok(unit instanceof TokenIdentifier, 'unit should be a TokenIdentifier')
	return unit
}
export function primitiveLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodePrimitiveLiteral {
	const expression_unit: ParseNodeExpressionUnit = unitExpressionFromSource(src, config)
	assert_arrayLength(expression_unit.children, 1, 'expression unit should have 1 child')
	const unit: Token | ParseNodePrimitiveLiteral | ParseNodeStringTemplate = expression_unit.children[0]
	assert.ok(unit instanceof ParseNodePrimitiveLiteral, 'unit should be a ParseNodePrimitiveLiteral')
	return unit
}
export function unitExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionUnit {
	const expression_unary: ParseNodeExpressionUnarySymbol = unaryExpressionFromSource(src, config)
	assert_arrayLength(expression_unary.children, 1, 'unary expression should have 1 child')
	return expression_unary.children[0]
}
export function unaryExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionUnarySymbol {
	const expression_exp: ParseNodeExpressionExponential = exponentialExpressionFromSource(src, config)
	assert_arrayLength(expression_exp.children, 1, 'exponential expression should have 1 child')
	return expression_exp.children[0]
}
export function exponentialExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionExponential {
	const expression_mul: ParseNodeExpressionMultiplicative = multiplicativeExpressionFromSource(src, config)
	assert_arrayLength(expression_mul.children, 1, 'multiplicative expression should have 1 child')
	return expression_mul.children[0]
}
export function multiplicativeExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionMultiplicative {
	const expression_add: ParseNodeExpressionAdditive = additiveExpressionFromSource(src, config)
	assert_arrayLength(expression_add.children, 1, 'additive expression should have 1 child')
	return expression_add.children[0]
}
export function additiveExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionAdditive {
	const expression_compare: ParseNodeExpressionComparative = comparativeExpressionFromSource(src, config)
	assert_arrayLength(expression_compare.children, 1, 'comparative expression should have 1 child')
	return expression_compare.children[0]
}
export function comparativeExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionComparative {
	const expression_eq: ParseNodeExpressionEquality = equalityExpressionFromSource(src, config)
	assert_arrayLength(expression_eq.children, 1, 'equality expression should have 1 child')
	return expression_eq.children[0]
}
export function equalityExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionEquality {
	const expression_conj: ParseNodeExpressionConjunctive = conjunctiveExpressionFromSource(src, config)
	assert_arrayLength(expression_conj.children, 1, 'conjunctive expression should have 1 child')
	return expression_conj.children[0]
}
export function conjunctiveExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionConjunctive {
	const expression_disj: ParseNodeExpressionDisjunctive = disjunctiveExpressionFromSource(src, config)
	assert_arrayLength(expression_disj.children, 1, 'disjunctive expression should have 1 child')
	return expression_disj.children[0]
}
export function disjunctiveExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionDisjunctive {
	const expression: ParseNodeExpression = expressionFromSource(src, config)
	const expression_disj: ParseNodeExpressionDisjunctive | ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_disj instanceof ParseNodeExpressionDisjunctive, 'expression_disj should be a ParseNodeExpressionDisjunctive')
	return expression_disj
}
export function conditionalExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionConditional {
	const expression: ParseNodeExpression = expressionFromSource(src, config)
	const expression_cond: ParseNodeExpressionDisjunctive | ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_cond instanceof ParseNodeExpressionConditional, 'expression_cond should be a ParseNodeExpressionConditional')
	return expression_cond
}
function expressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpression {
	const statement: ParseNodeStatement = statementFromSource(src, config)
	assert_arrayLength(statement.children, 2, 'statment should have 2 children')
	const [expression, endstat]: readonly [ParseNodeExpression, Token] = statement.children
	assert.ok(endstat instanceof TokenPunctuator)
	assert.strictEqual(endstat.source, Punctuator.ENDSTAT)
	return expression
}
function typeFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeType {
	const var_decl: ParseNodeDeclarationVariable = variableDeclarationFromSource(src, config)
	return (var_decl.children.length === 7) ? var_decl.children[3] : var_decl.children[4]
}
export function variableDeclarationFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeDeclarationVariable {
	const statement: ParseNodeStatement = statementFromSource(src, config)
	assert_arrayLength(statement.children, 1, 'statement should have 1 child')
	const var_decl: Token | ParseNodeDeclarationVariable | ParseNodeStatementAssignment = statement.children[0]
	assert.ok(var_decl instanceof ParseNodeDeclarationVariable)
	return var_decl
}
export function statementFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeStatement {
	const goal: ParseNodeGoal = new Lexer(src, config).screener.parser.parse()
	assert_arrayLength(goal.children, 3, 'goal should have 3 children')
	const [sot, stat_list, eot]: readonly [Token, ParseNodeGoal__0__List, Token] = goal.children
	assert.ok(sot instanceof TokenFilebound)
	assert.ok(eot instanceof TokenFilebound)
	assert.strictEqual(sot.source, Filebound.SOT)
	assert.strictEqual(eot.source, Filebound.EOT)
	assert_arrayLength(stat_list.children, 1, 'statement list should have 1 child')
	return stat_list.children[0]
}
