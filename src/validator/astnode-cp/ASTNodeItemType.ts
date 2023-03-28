import type {SyntaxNodeFamily} from '../utils-private.js';
import type {ASTNodeType} from './index.js';
import {ASTNodeCP} from './ASTNodeCP.js';



export class ASTNodeItemType extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeFamily<'entry_type', ['optional', 'variable']>,
		public readonly optional: boolean,
		public readonly val:      ASTNodeType,
	) {
		super(start_node, {optional}, [val]);
	}
}
