import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../src/SolidConfig'
import {
	Filebound,
	Punctuator,
	TokenFilebound,
	TokenPunctuator,
	TokenKeyword,
	TokenIdentifier,
	TokenNumber,
	TokenString,
} from '../src/class/Token.class'
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
} from '../src/class/ParseNode.class'
import Parser from '../src/class/Parser.class'
import {
	assert_arrayLength,
} from './assert-helpers'



export function statementFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ParseNodeStatement {
	const goal: ParseNodeGoal = new Parser(src, config).parse()
	assert_arrayLength(goal.children, 3, 'goal should have 3 children')
	const [sot, stat_list, eot]: readonly [TokenFilebound, ParseNodeGoal__0__List, TokenFilebound] = goal.children
	assert.strictEqual(sot.source, Filebound.SOT)
	assert.strictEqual(eot.source, Filebound.EOT)
	assert_arrayLength(stat_list.children, 1, 'statement list should have 1 child')
	return stat_list.children[0]
}
export function expressionFromStatement(statement: ParseNodeStatement): ParseNodeExpression {
	assert_arrayLength(statement.children, 2, 'statment should have 2 children')
	const [expr, endstat]: readonly [ParseNodeExpression, TokenPunctuator] = statement.children
	assert.strictEqual(endstat.source, Punctuator.ENDSTAT)
	return expr
}
export function conditionalExpressionFromExpression(expression: ParseNodeExpression): ParseNodeExpressionConditional {
	const expression_cond: ParseNodeExpressionBinary | ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_cond instanceof ParseNodeExpressionConditional)
	return expression_cond
}
export function additiveExpressionFromExpression(expression: ParseNodeExpression): ParseNodeExpressionBinary {
	const expression_add: ParseNodeExpressionBinary | ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_add instanceof ParseNodeExpressionBinary)
	return expression_add
}
export function multiplicativeExpressionFromAdditiveExpression(expression_add: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_add.children, 1, 'additive expression should have 1 child')
	const expression_mul: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_add.children[0]
	assert.ok(expression_mul instanceof ParseNodeExpressionBinary)
	return expression_mul
}
export function exponentialExpressionFromMultiplicativeExpression(expression_mul: ParseNodeExpressionBinary): ParseNodeExpressionBinary {
	assert_arrayLength(expression_mul.children, 1, 'multiplicative expression should have 1 child')
	const expression_exp: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_mul.children[0]
	assert.ok(expression_exp instanceof ParseNodeExpressionBinary)
	return expression_exp
}
export function unaryExpressionFromExponentialExpression(expression_exp: ParseNodeExpressionBinary): ParseNodeExpressionUnary {
	assert_arrayLength(expression_exp.children, 1, 'exponential expression should have 1 child')
	const expression_unary: ParseNodeExpressionUnary | ParseNodeExpressionBinary = expression_exp.children[0]
	assert.ok(expression_unary instanceof ParseNodeExpressionUnary)
	return expression_unary
}
export function unitExpressionFromUnaryExpression(expression_unary: ParseNodeExpressionUnary): ParseNodeExpressionUnit {
	assert_arrayLength(expression_unary.children, 1, 'unary expression should have 1 child')
	return expression_unary.children[0]
}
export function tokenLiteralFromExpressionUnit(expression_unit: ParseNodeExpressionUnit): TokenKeyword | TokenNumber | TokenString {
	assert_arrayLength(expression_unit.children, 1)
	const unit: TokenIdentifier | ParseNodePrimitiveLiteral | ParseNodeStringTemplate = expression_unit.children[0]
	assert.ok(unit instanceof ParseNodePrimitiveLiteral)
	return unit.children[0]
}
