import type {SyntaxNodeType} from '../utils-private.js';
import type {ASTNodeTypeConstant} from './index.js';
import {ASTNodeCP} from './ASTNodeCP.js';



export class ASTNodeIndexType extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeType<'property_access_type'>,
		public readonly val: ASTNodeTypeConstant,
	) {
		super(start_node, {}, [val]);
	}
}
