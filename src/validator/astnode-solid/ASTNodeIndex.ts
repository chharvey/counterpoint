import type {
	SyntaxNodeType,
} from './package.js';
import type {ASTNodeConstant} from './index.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



export class ASTNodeIndex extends ASTNodeSolid {
	constructor (
		start_node:
			| SyntaxNodeType<'property_access'>
			| SyntaxNodeType<'property_assign'>
		,
		readonly val: ASTNodeConstant,
	) {
		super(start_node, {}, [val]);
	}
}
