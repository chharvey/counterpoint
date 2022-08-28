import type {SyntaxNodeType} from './package.js';
import type {ASTNodeExpression} from './index.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeKey} from './ASTNodeKey.js';



export class ASTNodeProperty extends ASTNodeCP {
	constructor(
		start_node: SyntaxNodeType<'property'>,
		readonly key: ASTNodeKey,
		readonly val: ASTNodeExpression,
	) {
		super(start_node, {}, [key, val]);
	}
}
