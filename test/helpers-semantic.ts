import * as assert from 'assert'

import {
	SolidConfig,
	CONFIG_DEFAULT,
} from '../src/core/';
import {
	AST,
} from '../src/validator/'



export function statementFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeStatement {
	const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src, config);
	assert.strictEqual(goal.children.length, 1, 'semantic goal should have 1 child');
	return goal.children[0];
}
