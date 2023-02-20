import type {
	SyntaxNodeType,
	SyntaxNodeFamily,
} from '../utils-private.js';
import type {ASTNodeConstant} from './index.js';
import {ASTNodeCP} from './ASTNodeCP.js';



export class ASTNodeIndex extends ASTNodeCP {
	public constructor(
		start_node:
			| SyntaxNodeFamily<'property_access', ['variable']>
			| SyntaxNodeType<'property_assign'>
		,
		public readonly val: ASTNodeConstant,
	) {
		super(start_node, {}, [val]);
	}
}
