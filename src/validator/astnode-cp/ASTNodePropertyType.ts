import type {SyntaxNodeType} from './package.js';
import type {ASTNodeType} from './index.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeKey} from './ASTNodeKey.js';



export class ASTNodePropertyType extends ASTNodeCP {
	public constructor(
		start_node:
			| SyntaxNodeType<'entry_type__named'>
			| SyntaxNodeType<'entry_type__named__optional'>
		,
		public readonly optional: boolean,
		public readonly key:      ASTNodeKey,
		public readonly val:      ASTNodeType,
	) {
		super(start_node, {optional}, [key, val]);
	}
}
