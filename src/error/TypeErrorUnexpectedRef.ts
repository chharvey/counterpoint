import type {AST} from '../validator/index.js';
import type {TYPE} from '../typer/index.js';
import {TypeError} from './TypeError.js';



/**
 * A TypeErrorUnexpectedRef is thrown when a reference type is encountered where a value type is expected.
 * Value types/objects cannot contain reference types/objects, so this error is thrown in those situations.
 */
export class TypeErrorUnexpectedRef extends TypeError {
	/**
	 * Construct a new TypeErrorUnexpectedRef object.
	 * @param reftype - the received reference type
	 */
	public constructor(reftype: TYPE.Type, node: AST.ASTNodeItemType | AST.ASTNodePropertyType | AST.ASTNodeType | AST.ASTNodeExpression | AST.ASTNodeProperty) {
		super(
			`Encountered reference type \`${ reftype }\` but was expecting a value type.`,
			TypeError.CODES.get(TypeErrorUnexpectedRef),
			node.line_index,
			node.col_index,
		);
	}
}
