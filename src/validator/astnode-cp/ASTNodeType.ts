import {
	TYPE,
	CPConfig,
	CONFIG_DEFAULT,
} from './package.js';
import {ASTNodeDeclarationType} from './index.js';
import {ASTNodeCP} from './ASTNodeCP.js';



/**
 * A sematic node representing a type.
 * Known subclasses:
 * - ASTNodeTypeConstant
 * - ASTNodeTypeAlias
 * - ASTNodeTypeTuple
 * - ASTNodeTypeRecord
 * - ASTNodeTypeList
 * - ASTNodeTypeDict
 * - ASTNodeTypeSet
 * - ASTNodeTypeMap
 * - ASTNodeTypeAccess
 * - ASTNodeTypeCall
 * - ASTNodeTypeOperation
 */
export abstract class ASTNodeType extends ASTNodeCP {
	/**
	 * Construct a new ASTNodeType from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeType representing the given source
	 */
	static fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeType {
		const statement: ASTNodeDeclarationType = ASTNodeDeclarationType.fromSource(`type T = ${ src };`, config);
		return statement.assigned;
	}
	/**
	 * @final
	 */
	override typeCheck(): void {
		return; // no type-checking necessary
	}
	/**
	 * Assess the type-value of this node at compile-time.
	 * @returns the computed type-value of this node
	 */
	abstract eval(): TYPE.Type;
}
