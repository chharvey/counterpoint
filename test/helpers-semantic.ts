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
	SemanticStatementType,
	SemanticNodeDeclarationVariable,
	SemanticNodeGoal,
} from '../src/validator/'



export function constantFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeConstant {
	const statement: AST.ASTNodeStatementExpression = statementExpressionFromSource(src, config);
	assert_arrayLength(statement.children, 1, 'semantic statement should have 1 child')
	const expression: AST.ASTNodeExpression = statement.children[0];
	assert.ok(expression instanceof AST.ASTNodeConstant);
	return expression
}
export function identifierFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeIdentifier {
	const statement: AST.ASTNodeStatementExpression = statementExpressionFromSource(src, config);
	assert_arrayLength(statement.children, 1, 'semantic statement should have 1 child');
	const expression: AST.ASTNodeExpression = statement.children[0];
	assert.ok(expression instanceof AST.ASTNodeIdentifier);
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
	const goal: SemanticNodeGoal = goalFromSource(src, config);
	assert_arrayLength(goal.children, 1, 'semantic goal should have 1 child')
	const statement: SemanticStatementType = goal.children[0] as SemanticStatementType
	assert.ok(statement instanceof AST.ASTNodeStatementExpression);
	return statement
}
export function variableDeclarationFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): SemanticNodeDeclarationVariable {
	const goal: SemanticNodeGoal = goalFromSource(src, config);
	assert_arrayLength(goal.children, 1, 'semantic goal should have 1 child');
	const statement: SemanticStatementType = goal.children[0] as SemanticStatementType;
	assert.ok(statement instanceof SemanticNodeDeclarationVariable);
	return statement;
}
export function assignmentFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.SemanticNodeAssignment {
	const goal: AST.SemanticNodeGoal = goalFromSource(src, config);
	assert_arrayLength(goal.children, 1, 'semantic goal should have 1 child');
	const statement: AST.SemanticStatementType = goal.children[0] as AST.SemanticStatementType;
	assert.ok(statement instanceof AST.SemanticNodeAssignment);
	return statement;
}
export function goalFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): SemanticNodeGoal {
	return Decorator.decorate(new Parser(src, config).parse());
}
