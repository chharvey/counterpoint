import * as assert from 'assert';
import {
	NonemptyArray,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
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
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeOperation {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeOperation);
		return typ;
	}
	constructor (
		start_node:
			| PARSENODE.ParseNodeTypeUnarySymbol
			| PARSENODE.ParseNodeTypeUnaryKeyword
			| PARSENODE.ParseNodeTypeIntersection
			| PARSENODE.ParseNodeTypeUnion
			| SyntaxNodeType<'type_unary_symbol'>
			| SyntaxNodeType<'type_unary_keyword'>
			| SyntaxNodeType<'type_intersection'>
			| SyntaxNodeType<'type_union'>
		,
		readonly operator: ValidTypeOperator,
		override readonly children: Readonly<NonemptyArray<ASTNodeType>>,
	) {
		super(start_node, {operator}, children)
	}
}
