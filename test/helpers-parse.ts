import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../src/SolidConfig'
import {
	Lexer,
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
	ParseNodeStringTemplate,
	ParseNodeExpressionUnit,
	ParseNodeExpressionUnary,
	ParseNodeExpressionBinary,
	ParseNodeExpressionConditional,
	ParseNodeExpression,
	ParseNodeStatement,
	ParseNodeGoal,
	ParseNodeGoal__0__List,
} from '../src/parser/'
import {
	assert_arrayLength,
} from './assert-helpers'



export function tokenLiteralFromExpressionUnit(expression_unit: ParseNodeExpressionUnit): TokenKeyword | TokenNumber | TokenString {
	assert_arrayLength(expression_unit.children, 1)
	const unit: TokenIdentifier | ParseNodePrimitiveLiteral | ParseNodeStringTemplate = expression_unit.children[0]
	assert.ok(unit instanceof ParseNodePrimitiveLiteral)
	return unit.children[0]
}
export function unitExpressionFromUnaryExpression(expression_unary: ParseNodeExpressionUnary): ParseNodeExpressionUnit {
	assert_arrayLength(expression_unary.children, 1, 'unary expression should have 1 child')
	return expression_unary.children[0]
}
export function unaryExpressionFromExponentialExpression(expression_exp: ParseNodeExpressionBinary): ParseNodeExpressionUnary {
	assert_arrayLength(expression_exp.children, 1, 'exponential expression should have 1 child')
	const expression_unary: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_exp.children[0]
	assert.ok(expression_unary instanceof ParseNodeExpressionUnary)
	return expression_unary
}
export function exponentialExpressionFromMultiplicativeExpression(expression_mul: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_mul.children, 1, 'multiplicative expression should have 1 child')
	const expression_exp: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_mul.children[0]
	assert.ok(expression_exp instanceof ParseNodeExpressionBinary)
	return expression_exp
}
export function multiplicativeExpressionFromAdditiveExpression(expression_add: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_add.children, 1, 'additive expression should have 1 child')
	const expression_mul: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_add.children[0]
	assert.ok(expression_mul instanceof ParseNodeExpressionBinary)
	return expression_mul
}
export function additiveExpressionFromComparativeExpression(expression_compare: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_compare.children, 1, 'comparative expression should have 1 child')
	const expression_add: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_compare.children[0]
	assert.ok(expression_add instanceof ParseNodeExpressionBinary)
	return expression_add
}
export function comparativeExpressionFromEqualityExpression(expression_eq: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_eq.children, 1, 'equality expression should have 1 child')
	const expression_compare: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_eq.children[0]
	assert.ok(expression_compare instanceof ParseNodeExpressionBinary)
	return expression_compare
}
export function equalityExpressionFromConjunctiveExpression(expression_conj: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_conj.children, 1, 'conjunctive expression should have 1 child')
	const expression_eq: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_conj.children[0]
	assert.ok(expression_eq instanceof ParseNodeExpressionBinary)
	return expression_eq
}
export function conjunctiveExpressionFromDisjunctiveExpression(expression_disj: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_disj.children, 1, 'disjunctive expression should have 1 child')
	const expression_conj: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_disj.children[0]
	assert.ok(expression_conj instanceof ParseNodeExpressionBinary)
	return expression_conj
}
export function disjunctiveExpressionFromExpression(expression: ParseNodeExpression): ParseNodeExpressionBinary {
	const expression_disj: ParseNodeExpressionBinary | ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_disj instanceof ParseNodeExpressionBinary)
	return expression_disj
}
export function conditionalExpressionFromExpression(expression: ParseNodeExpression): ParseNodeExpressionConditional {
	const expression_cond: ParseNodeExpressionBinary | ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_cond instanceof ParseNodeExpressionConditional)
	return expression_cond
}
export function expressionFromStatement(statement: ParseNodeStatement): ParseNodeExpression {
	assert_arrayLength(statement.children, 2, 'statment should have 2 children')
	const [expression, endstat]: readonly [ParseNodeExpression, TokenPunctuator] = statement.children
	assert.strictEqual(endstat.source, Punctuator.ENDSTAT)
	return expression
}
export function statementFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeStatement {
	const goal: ParseNodeGoal = new Lexer(src, config).screener.parser.parse()
	assert_arrayLength(goal.children, 3, 'goal should have 3 children')
	const [sot, stat_list, eot]: readonly [TokenFilebound, ParseNodeGoal__0__List, TokenFilebound] = goal.children
	assert.strictEqual(sot.source, Filebound.SOT)
	assert.strictEqual(eot.source, Filebound.EOT)
	assert_arrayLength(stat_list.children, 1, 'statement list should have 1 child')
	return stat_list.children[0]
}
