import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../src/SolidConfig'
import {
	Scanner,
	Filebound,
	Punctuator,
	TokenFilebound,
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
	ParseNodeTypeUnary,
	ParseNodeTypeBinary,
	ParseNodeType,
	ParseNodeStringTemplate,
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
} from '../src/parser/'
import {
	assert_arrayLength,
} from './assert-helpers'



export function tokenLiteralFromTypeString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): TokenKeyword | TokenNumber | TokenString {
	return primitiveTypeFromString(typestring, config).children[0]
}
export function tokenKeywordFromTypeString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): TokenKeyword {
	return keywordTypeFromString(typestring, config).children[0]
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
	const type_unary: ParseNodeTypeUnary = unaryTypeFromString(typestring, config)
	assert_arrayLength(type_unary.children, 1, 'unary type should have 1 child')
	return type_unary.children[0]
}
export function unaryTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeTypeUnary {
	const type_intersection: ParseNodeTypeBinary = intersectionTypeFromString(typestring, config)
	assert_arrayLength(type_intersection.children, 1, 'intersection type should have 1 child')
	const type_unary: ParseNodeTypeBinary | ParseNodeTypeUnary = type_intersection.children[0]
	assert.ok(type_unary instanceof ParseNodeTypeUnary, 'type_unary should be a ParseNodeTypeUnary')
	return type_unary
}
export function intersectionTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeTypeBinary {
	const type_union: ParseNodeTypeBinary = unionTypeFromString(typestring, config)
	assert_arrayLength(type_union.children, 1, 'union type should have 1 child')
	const type_intersection: ParseNodeTypeBinary | ParseNodeTypeUnary = type_union.children[0]
	assert.ok(type_intersection instanceof ParseNodeTypeBinary, 'type_intersection should be a ParseNodeTypeBinary')
	return type_intersection
}
export function unionTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeTypeBinary {
	const type_: ParseNodeType = typeFromString(typestring, config)
	return type_.children[0]
}
function typeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeType {
	return typeFromSource(`let x: ${ typestring } = null;`, config)
}
export function tokenLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): TokenKeyword | TokenNumber | TokenString {
	return primitiveLiteralFromSource(src, config).children[0]
}
export function tokenIdentifierFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): TokenIdentifier {
	const expression_unit: ParseNodeExpressionUnit = unitExpressionFromSource(src, config)
	assert_arrayLength(expression_unit.children, 1, 'expression unit should have 1 child')
	const unit: TokenIdentifier | ParseNodePrimitiveLiteral | ParseNodeStringTemplate = expression_unit.children[0]
	assert.ok(unit instanceof TokenIdentifier, 'unit should be a TokenIdentifier')
	return unit
}
export function primitiveLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodePrimitiveLiteral {
	const expression_unit: ParseNodeExpressionUnit = unitExpressionFromSource(src, config)
	assert_arrayLength(expression_unit.children, 1, 'expression unit should have 1 child')
	const unit: TokenIdentifier | ParseNodePrimitiveLiteral | ParseNodeStringTemplate = expression_unit.children[0]
	assert.ok(unit instanceof ParseNodePrimitiveLiteral, 'unit should be a ParseNodePrimitiveLiteral')
	return unit
}
export function unitExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionUnit {
	const expression_unary: ParseNodeExpressionUnary = unaryExpressionFromSource(src, config)
	assert_arrayLength(expression_unary.children, 1, 'unary expression should have 1 child')
	return expression_unary.children[0]
}
export function unaryExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionUnary {
	const expression_exp: ParseNodeExpressionBinary = exponentialExpressionFromSource(src, config)
	assert_arrayLength(expression_exp.children, 1, 'exponential expression should have 1 child')
	const expression_unary: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_exp.children[0]
	assert.ok(expression_unary instanceof ParseNodeExpressionUnary, 'expression_unary should be a ParseNodeExpressionUnary')
	return expression_unary
}
export function exponentialExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionBinary {
	const expression_mul: ParseNodeExpressionBinary = multiplicativeExpressionFromSource(src, config)
	assert_arrayLength(expression_mul.children, 1, 'multiplicative expression should have 1 child')
	const expression_exp: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_mul.children[0]
	assert.ok(expression_exp instanceof ParseNodeExpressionBinary, 'expression_exp should be a ParseNodeExpressionBinary')
	return expression_exp
}
export function multiplicativeExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionBinary {
	const expression_add: ParseNodeExpressionBinary = additiveExpressionFromSource(src, config)
	assert_arrayLength(expression_add.children, 1, 'additive expression should have 1 child')
	const expression_mul: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_add.children[0]
	assert.ok(expression_mul instanceof ParseNodeExpressionBinary, 'expression_mul should be a ParseNodeExpressionBinary')
	return expression_mul
}
export function additiveExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionBinary {
	const expression_compare: ParseNodeExpressionBinary = comparativeExpressionFromSource(src, config)
	assert_arrayLength(expression_compare.children, 1, 'comparative expression should have 1 child')
	const expression_add: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_compare.children[0]
	assert.ok(expression_add instanceof ParseNodeExpressionBinary, 'expression_add should be a ParseNodeExpressionBinary')
	return expression_add
}
export function comparativeExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionBinary {
	const expression_eq: ParseNodeExpressionBinary = equalityExpressionFromSource(src, config)
	assert_arrayLength(expression_eq.children, 1, 'equality expression should have 1 child')
	const expression_compare: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_eq.children[0]
	assert.ok(expression_compare instanceof ParseNodeExpressionBinary, 'expression_compare should be a ParseNodeExpressionBinary')
	return expression_compare
}
export function equalityExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionBinary {
	const expression_conj: ParseNodeExpressionBinary = conjunctiveExpressionFromSource(src, config)
	assert_arrayLength(expression_conj.children, 1, 'conjunctive expression should have 1 child')
	const expression_eq: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_conj.children[0]
	assert.ok(expression_eq instanceof ParseNodeExpressionBinary, 'expression_eq should be a ParseNodeExpressionBinary')
	return expression_eq
}
export function conjunctiveExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionBinary {
	const expression_disj: ParseNodeExpressionBinary = disjunctiveExpressionFromSource(src, config)
	assert_arrayLength(expression_disj.children, 1, 'disjunctive expression should have 1 child')
	const expression_conj: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_disj.children[0]
	assert.ok(expression_conj instanceof ParseNodeExpressionBinary, 'expression_conj should be a ParseNodeExpressionBinary')
	return expression_conj
}
export function disjunctiveExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionBinary {
	const expression: ParseNodeExpression = expressionFromSource(src, config)
	const expression_disj: ParseNodeExpressionBinary | ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_disj instanceof ParseNodeExpressionBinary, 'expression_disj should be a ParseNodeExpressionBinary')
	return expression_disj
}
export function conditionalExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpressionConditional {
	const expression: ParseNodeExpression = expressionFromSource(src, config)
	const expression_cond: ParseNodeExpressionBinary | ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_cond instanceof ParseNodeExpressionConditional, 'expression_cond should be a ParseNodeExpressionConditional')
	return expression_cond
}
function expressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeExpression {
	const statement: ParseNodeStatement = statementFromSource(src, config)
	assert_arrayLength(statement.children, 2, 'statment should have 2 children')
	const [expression, endstat]: readonly [ParseNodeExpression, TokenPunctuator] = statement.children
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
	const var_decl: TokenPunctuator | ParseNodeDeclarationVariable | ParseNodeStatementAssignment = statement.children[0]
	assert.ok(var_decl instanceof ParseNodeDeclarationVariable)
	return var_decl
}
export function statementFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeStatement {
	const goal: ParseNodeGoal = new Scanner(src, config).lexer.screener.parser.parse()
	assert_arrayLength(goal.children, 3, 'goal should have 3 children')
	const [sot, stat_list, eot]: readonly [TokenFilebound, ParseNodeGoal__0__List, TokenFilebound] = goal.children
	assert.strictEqual(sot.source, Filebound.SOT)
	assert.strictEqual(eot.source, Filebound.EOT)
	assert_arrayLength(stat_list.children, 1, 'statement list should have 1 child')
	return stat_list.children[0]
}
