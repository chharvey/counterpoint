import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {ASTNodeType} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



export class ASTNodeItemType extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeFamily<'entry_type', ['optional']>,
		public readonly optional: boolean,
		public readonly val:      ASTNodeType,
	) {
		super(start_node, {optional}, [val]);
	}
}
