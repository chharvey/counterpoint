import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {Type} from './index.ts';
import {AstNode} from './AstNode.ts';



export class ItemType extends AstNode {
	public constructor(
		start_node: SyntaxNodeFamily<'entry_type', ['optional']>,
		public readonly optional:  boolean,
		public readonly typevalue: Type,
	) {
		super(start_node, {optional}, [typevalue]);
	}
}
