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



export function tokenLiteralFromTypeUnit(type_unit: ParseNodeTypeUnit): TokenKeyword | TokenNumber | TokenString {
	assert_arrayLength(type_unit.children, 1, 'type unit should have 1 child')
	const unit: ParseNodePrimitiveLiteral | ParseNodeTypeKeyword = type_unit.children[0]
	assert.ok(unit instanceof ParseNodePrimitiveLiteral, 'unit should be a ParseNodePrimitiveLiteral')
	return unit.children[0]
}
export function tokenKeywordFromTypeUnit(type_unit: ParseNodeTypeUnit): TokenKeyword {
	assert_arrayLength(type_unit.children, 1, 'type unit should have 1 child')
	const unit: ParseNodePrimitiveLiteral | ParseNodeTypeKeyword = type_unit.children[0]
	assert.ok(unit instanceof ParseNodeTypeKeyword, 'unit shoudl be a ParseNodeTypeKeyword')
	return unit.children[0]
}
export function unitTypeFromUnaryType(type_unary: ParseNodeTypeUnary): ParseNodeTypeUnit {
	assert_arrayLength(type_unary.children, 1, 'unary type should have 1 child')
	return type_unary.children[0]
}
export function unaryTypeFromIntersectionType(type_intersection: ParseNodeTypeBinary): ParseNodeTypeUnary {
	assert_arrayLength(type_intersection.children, 1, 'intersection type should have 1 child')
	const type_unary: ParseNodeTypeBinary | ParseNodeTypeUnary = type_intersection.children[0]
	assert.ok(type_unary instanceof ParseNodeTypeUnary, 'type_unary shoudl be a ParseNodeTypeUnary')
	return type_unary
}
export function intersectionTypeFromUnionType(type_union: ParseNodeTypeBinary): ParseNodeTypeBinary {
	assert_arrayLength(type_union.children, 1, 'union type should have 1 child')
	const type_intersection: ParseNodeTypeBinary | ParseNodeTypeUnary = type_union.children[0]
	assert.ok(type_intersection instanceof ParseNodeTypeBinary, 'type_intersection shoudl be a ParseNodeTypeBinary')
	return type_intersection
}
export function unionTypeFromType(type_: ParseNodeType): ParseNodeTypeBinary {
	return type_.children[0]
}
export function tokenIdentifierFromExpressionUnit(expression_unit: ParseNodeExpressionUnit): TokenIdentifier {
	assert_arrayLength(expression_unit.children, 1, 'expression unit should have 1 child')
	const unit: TokenIdentifier | ParseNodePrimitiveLiteral | ParseNodeStringTemplate = expression_unit.children[0]
	assert.ok(unit instanceof TokenIdentifier, 'unit should be a TokenIdentifier')
	return unit
}
export function tokenLiteralFromExpressionUnit(expression_unit: ParseNodeExpressionUnit): TokenKeyword | TokenNumber | TokenString {
	assert_arrayLength(expression_unit.children, 1, 'expression unit should have 1 child')
	const unit: TokenIdentifier | ParseNodePrimitiveLiteral | ParseNodeStringTemplate = expression_unit.children[0]
	assert.ok(unit instanceof ParseNodePrimitiveLiteral, 'unit should be a ParseNodePrimitiveLiteral')
	return unit.children[0]
}
export function unitExpressionFromUnaryExpression(expression_unary: ParseNodeExpressionUnary): ParseNodeExpressionUnit {
	assert_arrayLength(expression_unary.children, 1, 'unary expression should have 1 child')
	return expression_unary.children[0]
}
export function unaryExpressionFromExponentialExpression(expression_exp: ParseNodeExpressionBinary): ParseNodeExpressionUnary {
	assert_arrayLength(expression_exp.children, 1, 'exponential expression should have 1 child')
	const expression_unary: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_exp.children[0]
	assert.ok(expression_unary instanceof ParseNodeExpressionUnary, 'expression_unary should be a ParseNodeExpressionUnary')
	return expression_unary
}
export function exponentialExpressionFromMultiplicativeExpression(expression_mul: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_mul.children, 1, 'multiplicative expression should have 1 child')
	const expression_exp: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_mul.children[0]
	assert.ok(expression_exp instanceof ParseNodeExpressionBinary, 'expression_exp should be a ParseNodeExpressionBinary')
	return expression_exp
}
export function multiplicativeExpressionFromAdditiveExpression(expression_add: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_add.children, 1, 'additive expression should have 1 child')
	const expression_mul: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_add.children[0]
	assert.ok(expression_mul instanceof ParseNodeExpressionBinary, 'expression_mul should be a ParseNodeExpressionBinary')
	return expression_mul
}
export function additiveExpressionFromComparativeExpression(expression_compare: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_compare.children, 1, 'comparative expression should have 1 child')
	const expression_add: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_compare.children[0]
	assert.ok(expression_add instanceof ParseNodeExpressionBinary, 'expression_add should be a ParseNodeExpressionBinary')
	return expression_add
}
export function comparativeExpressionFromEqualityExpression(expression_eq: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_eq.children, 1, 'equality expression should have 1 child')
	const expression_compare: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_eq.children[0]
	assert.ok(expression_compare instanceof ParseNodeExpressionBinary, 'expression_compare should be a ParseNodeExpressionBinary')
	return expression_compare
}
export function equalityExpressionFromConjunctiveExpression(expression_conj: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_conj.children, 1, 'conjunctive expression should have 1 child')
	const expression_eq: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_conj.children[0]
	assert.ok(expression_eq instanceof ParseNodeExpressionBinary, 'expression_eq should be a ParseNodeExpressionBinary')
	return expression_eq
}
export function conjunctiveExpressionFromDisjunctiveExpression(expression_disj: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_disj.children, 1, 'disjunctive expression should have 1 child')
	const expression_conj: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_disj.children[0]
	assert.ok(expression_conj instanceof ParseNodeExpressionBinary, 'expression_conj should be a ParseNodeExpressionBinary')
	return expression_conj
}
export function disjunctiveExpressionFromExpression(expression: ParseNodeExpression): ParseNodeExpressionBinary {
	const expression_disj: ParseNodeExpressionBinary | ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_disj instanceof ParseNodeExpressionBinary, 'expression_disj should be a ParseNodeExpressionBinary')
	return expression_disj
}
export function conditionalExpressionFromExpression(expression: ParseNodeExpression): ParseNodeExpressionConditional {
	const expression_cond: ParseNodeExpressionBinary | ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_cond instanceof ParseNodeExpressionConditional, 'expression_cond should be a ParseNodeExpressionConditional')
	return expression_cond
}
export function expressionFromStatement(statement: ParseNodeStatement): ParseNodeExpression {
	assert_arrayLength(statement.children, 2, 'statment should have 2 children')
	const [expression, endstat]: readonly [ParseNodeExpression, TokenPunctuator] = statement.children
	assert.strictEqual(endstat.source, Punctuator.ENDSTAT)
	return expression
}
export function typeFromVariableDeclaration(var_decl: ParseNodeDeclarationVariable): ParseNodeType {
	return (var_decl.children.length === 7) ? var_decl.children[3] : var_decl.children[4]
}
export function variableDeclarationFromStatement(statement: ParseNodeStatement): ParseNodeDeclarationVariable {
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
