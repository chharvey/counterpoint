import type {
	PARSENODE,
	SyntaxNodeType,
} from './package.js';
import type {ASTNodeTypeConstant} from './index.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



export class ASTNodeIndexType extends ASTNodeSolid {
	constructor (
		start_node: PARSENODE.ParseNodePropertyAccessType | SyntaxNodeType<'property_access_type'>,
		readonly val: ASTNodeTypeConstant,
	) {
		super(start_node, {}, [val]);
	}
}
