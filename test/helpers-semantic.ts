import * as assert from 'assert'

import {
	SolidConfig,
	CONFIG_DEFAULT,
} from '../src/core/';
import {
	assert_arrayLength,
} from './assert-helpers'
import {
	ParserSolid as Parser,
} from '../src/parser/';
import {
	Decorator,
	AST,
} from '../src/validator/'



export function typeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeType {
	return typeDeclarationFromSource(`type T = ${ typestring };`, config).children[1];
}
export function constantFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeConstant {
	const statement: AST.ASTNodeStatementExpression = statementExpressionFromSource(src, config);
	assert_arrayLength(statement.children, 1, 'semantic statement should have 1 child')
	const expression: AST.ASTNodeExpression = statement.children[0];
	assert.ok(expression instanceof AST.ASTNodeConstant);
	return expression
}
export function variableFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeVariable {
	const statement: AST.ASTNodeStatementExpression = statementExpressionFromSource(src, config);
	assert_arrayLength(statement.children, 1, 'semantic statement should have 1 child');
	const expression: AST.ASTNodeExpression = statement.children[0];
	assert.ok(expression instanceof AST.ASTNodeVariable);
	return expression;
}
export function templateFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeTemplate {
	const statement: AST.ASTNodeStatementExpression = statementExpressionFromSource(src, config);
	assert_arrayLength(statement.children, 1, 'semantic statement should have 1 child');
	const expression: AST.ASTNodeExpression = statement.children[0];
	assert.ok(expression instanceof AST.ASTNodeTemplate);
	return expression;
}
export function tupleFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeList {
	const statement: AST.ASTNodeStatementExpression = statementExpressionFromSource(src, config);
	assert_arrayLength(statement.children, 1, 'semantic statement should have 1 child');
	const expression: AST.ASTNodeExpression = statement.children[0];
	assert.ok(expression instanceof AST.ASTNodeList);
	return expression;
}
export function recordFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeRecord {
	const statement: AST.ASTNodeStatementExpression = statementExpressionFromSource(src, config);
	assert_arrayLength(statement.children, 1, 'semantic statement should have 1 child');
	const expression: AST.ASTNodeExpression = statement.children[0];
	assert.ok(expression instanceof AST.ASTNodeRecord);
	return expression;
}
export function mappingFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeMapping {
	const statement: AST.ASTNodeStatementExpression = statementExpressionFromSource(src, config);
	assert_arrayLength(statement.children, 1, 'semantic statement should have 1 child');
	const expression: AST.ASTNodeExpression = statement.children[0];
	assert.ok(expression instanceof AST.ASTNodeMapping);
	return expression;
}
export function operationFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeOperation {
	const statement: AST.ASTNodeStatementExpression = statementExpressionFromSource(src, config);
	assert_arrayLength(statement.children, 1, 'semantic statement should have 1 child')
	const expression: AST.ASTNodeExpression = statement.children[0];
	assert.ok(expression instanceof AST.ASTNodeOperation);
	return expression
}
export function statementExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeStatementExpression {
	const statement: AST.ASTNodeStatement = statementFromSource(src, config);
	assert.ok(statement instanceof AST.ASTNodeStatementExpression);
	return statement
}
export function typeDeclarationFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeDeclarationType {
	const statement: AST.ASTNodeStatement = statementFromSource(src, config);
	assert.ok(statement instanceof AST.ASTNodeDeclarationType);
	return statement;
}
export function variableDeclarationFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeDeclarationVariable {
	const statement: AST.ASTNodeStatement = statementFromSource(src, config);
	assert.ok(statement instanceof AST.ASTNodeDeclarationVariable);
	return statement;
}
export function assignmentFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeAssignment {
	const statement: AST.ASTNodeStatement = statementFromSource(src, config);
	assert.ok(statement instanceof AST.ASTNodeAssignment);
	return statement;
}
function statementFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeStatement {
	const goal: AST.ASTNodeGoal = goalFromSource(src, config);
	assert.strictEqual(goal.children.length, 1, 'semantic goal should have 1 child');
	return goal.children[0];
}
export function goalFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeGoal {
	return Decorator.decorate(new Parser(src, config).parse());
}
