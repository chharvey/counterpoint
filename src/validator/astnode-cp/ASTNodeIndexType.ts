import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeTypeConstant} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



export class ASTNodeIndexType extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeType<'property_access_type'>,
		public readonly val: ASTNodeTypeConstant,
	) {
		super(start_node, {}, [val]);
	}
}
