import * as assert from 'assert';
import {
	NonemptyArray,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
	ValidTypeOperator,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



/**
 * Known subclasses:
 * - ASTNodeTypeOperationUnary
 * - ASTNodeTypeOperationBinary
 */
export abstract class ASTNodeTypeOperation extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeOperation {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeOperation);
		return typ;
	}

	public constructor(
		start_node:
			| SyntaxNodeType<'type_unary_symbol'>
			| SyntaxNodeType<'type_unary_keyword'>
			| SyntaxNodeType<'type_intersection'>
			| SyntaxNodeType<'type_union'>
		,
		protected readonly operator: ValidTypeOperator,
		public override readonly children: Readonly<NonemptyArray<ASTNodeType>>,
	) {
		super(start_node, {operator}, children);
	}
}
