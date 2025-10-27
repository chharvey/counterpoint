import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeCP} from './ASTNodeCP.ts';
import {ASTNodeType} from './ASTNodeType.ts';



/**
 * Known subclasses:
 * - ASTNodeTypeTuple
 * - ASTNodeTypeRecord
 * - ASTNodeTypeList
 * - ASTNodeTypeDict
 * - ASTNodeTypeSet
 * - ASTNodeTypeMap
 */
export abstract class ASTNodeTypeCollectionLiteral extends ASTNodeType {
	protected constructor(
		start_node:
			| SyntaxNodeType<'type_tuple_literal'>
			| SyntaxNodeType<'type_record_literal'>
			| SyntaxNodeType<'type_list_literal'>
			| SyntaxNodeType<'type_dict_literal'>
			| SyntaxNodeType<'type_set_literal'>
			| SyntaxNodeType<'type_map_literal'>
			| SyntaxNodeType<'type_unary_symbol'>,

		public override readonly children: readonly ASTNodeCP[],
	) {
		super(start_node, {}, children);
	}
}
