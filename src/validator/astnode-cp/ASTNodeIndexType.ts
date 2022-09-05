import type {
	SyntaxNodeType,
} from './package.js';
import type {ASTNodeTypeConstant} from './index.js';
import {ASTNodeCP} from './ASTNodeCP.js';



export class ASTNodeIndexType extends ASTNodeCP {
	constructor (
		start_node: SyntaxNodeType<'property_access_type'>,
		readonly val: ASTNodeTypeConstant,
	) {
		super(start_node, {}, [val]);
	}
}
