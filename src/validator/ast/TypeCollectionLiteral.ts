import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeCP} from './ASTNodeCP.ts';
import {Type} from './Type.ts';



/**
 * Known subclasses:
 * - TypeTuple
 * - TypeRecord
 * - TypeList
 * - TypeDict
 * - TypeSet
 * - TypeMap
 */
export abstract class TypeCollectionLiteral extends Type {
	protected constructor(
		start_node: (
			| SyntaxNodeType<'type_tuple_literal'>
			| SyntaxNodeType<'type_record_literal'>
			| SyntaxNodeType<'type_list_literal'>
			| SyntaxNodeType<'type_dict_literal'>
			| SyntaxNodeType<'type_set_literal'>
			| SyntaxNodeType<'type_map_literal'>
		),

		public override readonly children: readonly ASTNodeCP[],
	) {
		super(start_node, {}, children);
	}
}
