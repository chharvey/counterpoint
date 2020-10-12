import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../src/SolidConfig'
import {
	assert_arrayLength,
} from './assert-helpers'
import {
	LexerSolid as Lexer,
} from '../src/lexer/'
import {
	SemanticNodeExpression,
	SemanticNodeConstant,
	SemanticNodeOperation,
	SemanticStatementType,
	SemanticNodeStatementExpression,
	SemanticNodeGoal,
} from '../src/validator/'



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
	const goal: SemanticNodeGoal = new Lexer(src, config).screener.parser.validator.validate()
	assert_arrayLength(goal.children, 1, 'semantic goal should have 1 child')
	const statement: SemanticStatementType = goal.children[0] as SemanticStatementType
	assert.ok(statement instanceof SemanticNodeStatementExpression)
	return statement
}
