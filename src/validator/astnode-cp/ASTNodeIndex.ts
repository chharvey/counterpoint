import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeConstant} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



export class ASTNodeIndex extends ASTNodeCP {
	public constructor(
		start_node:
			| SyntaxNodeType<'property_access'>
			| SyntaxNodeType<'property_assign'>,

		public readonly val: ASTNodeConstant,
	) {
		super(start_node, {}, [val]);
	}
}
