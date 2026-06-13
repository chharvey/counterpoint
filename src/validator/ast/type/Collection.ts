import type {SyntaxNodeType} from '../../utils-private.ts';
import type {AstNode} from '../AstNode.ts';
import {Type} from './Type.ts';



/**
 * Known subclasses:
 * - TypeTuple
 * - TypeRecord
 * - List
 * - Dict
 * - TypeSet
 * - TypeMap
 */
export abstract class Collection extends Type {
	protected constructor(
		start_node: (
			| SyntaxNodeType<'type_tuple_literal'>
			| SyntaxNodeType<'type_record_literal'>
			| SyntaxNodeType<'type_list_literal'>
			| SyntaxNodeType<'type_dict_literal'>
			| SyntaxNodeType<'type_set_literal'>
			| SyntaxNodeType<'type_map_literal'>
		),

		children: readonly AstNode[],
	) {
		super(start_node, {}, children);
	}
}
