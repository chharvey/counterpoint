import type {
	SyntaxNodeType,
} from './package.js';
import type {ASTNodeExpression} from './index.js';
import {ASTNodeCP} from './ASTNodeCP.js';



export class ASTNodeCase extends ASTNodeCP {
	constructor(
		start_node: SyntaxNodeType<'case'>,
		readonly antecedent: ASTNodeExpression,
		readonly consequent: ASTNodeExpression,
	) {
		super(start_node, {}, [antecedent, consequent]);
	}
}
