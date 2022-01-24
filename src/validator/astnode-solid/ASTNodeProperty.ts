import type {
	PARSENODE,
	SyntaxNodeType,
} from './package.js';
import type {ASTNodeExpression} from './index.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeKey} from './ASTNodeKey.js';



export class ASTNodeProperty extends ASTNodeSolid {
	constructor (
		start_node: PARSENODE.ParseNodeProperty | SyntaxNodeType<'property'>,
		readonly key: ASTNodeKey,
		readonly val: ASTNodeExpression,
	) {
		super(start_node, {}, [key, val]);
	}
}
