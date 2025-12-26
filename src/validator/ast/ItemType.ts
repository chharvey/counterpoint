import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {Type} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



export class ItemType extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeFamily<'entry_type', ['optional']>,
		public readonly optional:  boolean,
		public readonly typevalue: Type,
	) {
		super(start_node, {optional}, [typevalue]);
	}
}
