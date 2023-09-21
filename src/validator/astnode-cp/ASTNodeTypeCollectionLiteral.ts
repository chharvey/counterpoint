import type {SyntaxNodeType} from '../utils-private.js';
import type {ASTNodeCP} from './ASTNodeCP.js';
import {ASTNodeType} from './ASTNodeType.js';



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
			| SyntaxNodeType<'type_dict_literal'>
			| SyntaxNodeType<'type_map_literal'>
			| SyntaxNodeType<'type_unary_symbol'>
		,
		public override readonly children: readonly ASTNodeCP[],
		/** Does this node represent a reference type (versus a value type)? */
		attributes: Record<string, unknown> = {},
	) {
		super(start_node, {...attributes}, children);
	}
}
