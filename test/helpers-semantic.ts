import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../src/SolidConfig'
import Parser from '../src/parser/Parser.class'
import {
	assert_arrayLength,
} from './assert-helpers'
import {
	SemanticNodeExpression,
	SemanticNodeConstant,
	SemanticStatementType,
	SemanticNodeStatementExpression,
	SemanticNodeGoal,
	SemanticNodeOperation,
} from '../src/class/SemanticNode.class'



export function constantFromStatementExpression(statement: SemanticNodeStatementExpression): SemanticNodeConstant {
	assert_arrayLength(statement.children, 1, 'semantic statement should have 1 child')
	const expression: SemanticNodeExpression = statement.children[0]
	assert.ok(expression instanceof SemanticNodeConstant)
	return expression
}
export function operationFromStatementExpression(statement: SemanticNodeStatementExpression): SemanticNodeOperation {
	assert_arrayLength(statement.children, 1, 'semantic statement should have 1 child')
	const expression: SemanticNodeExpression = statement.children[0]
	assert.ok(expression instanceof SemanticNodeOperation)
	return expression
}
export function statementExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): SemanticNodeStatementExpression {
	const goal: SemanticNodeGoal = new Parser(src, config).parse().decorate()
	assert_arrayLength(goal.children, 1, 'semantic goal should have 1 child')
	const statement: SemanticStatementType = goal.children[0] as SemanticStatementType
	assert.ok(statement instanceof SemanticNodeStatementExpression)
	return statement
}
