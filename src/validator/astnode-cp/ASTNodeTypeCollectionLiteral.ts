import type {SyntaxNodeType} from '../utils-private.js';
import type {SyntaxNodeFamily} from '../utils-private.js';
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
			| SyntaxNodeFamily<'type_tuple_literal',  ['variable']>
			| SyntaxNodeFamily<'type_record_literal', ['variable']>
			| SyntaxNodeType<'type_dict_literal'>
			| SyntaxNodeType<'type_map_literal'>
			| SyntaxNodeFamily<'type_unary_symbol', ['variable']>
		,
		public override readonly children: readonly ASTNodeCP[],
		/** Does this node represent a reference type (versus a value type)? */
		protected readonly isRef: boolean = true,
		attributes: Record<string, unknown> = {},
	) {
		super(start_node, {...attributes, isRef}, children);
	}
}
