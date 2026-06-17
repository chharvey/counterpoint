import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {TYPE as AST_TYPE} from './index.ts';
import {AstNode} from './AstNode.ts';



export class ItemType extends AstNode {
	public constructor(
		start_node: SyntaxNodeFamily<'entry_type', ['optional']>,
		public readonly optional:  boolean,
		public readonly typevalue: AST_TYPE.Type,
	) {
		super(start_node, {optional}, [typevalue]);
	}
}
