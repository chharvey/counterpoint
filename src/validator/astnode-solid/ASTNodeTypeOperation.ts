import * as assert from 'assert';
import {
	NonemptyArray,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	ValidTypeOperator,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



/**
 * Known subclasses:
 * - ASTNodeTypeOperationUnary
 * - ASTNodeTypeOperationBinary
 */
export abstract class ASTNodeTypeOperation extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeOperation {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeOperation);
		return typ;
	}
	constructor (
		start_node: ParseNode,
		readonly operator: ValidTypeOperator,
		override readonly children: Readonly<NonemptyArray<ASTNodeType>>,
	) {
		super(start_node, {operator}, children)
	}
}
