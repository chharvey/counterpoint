import * as assert from 'assert';
import type {NonemptyArray} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeFamily} from '../utils-private.js';
import type {ValidTypeOperator} from '../Operator.js';
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
			| SyntaxNodeFamily<'type_unary_symbol',  ['variable']>
			| SyntaxNodeFamily<'type_unary_keyword', ['variable']>
			| SyntaxNodeFamily<'type_intersection',  ['variable']>
			| SyntaxNodeFamily<'type_union',         ['variable']>
		,
		protected readonly operator: ValidTypeOperator,
		public override readonly children: Readonly<NonemptyArray<ASTNodeType>>,
	) {
		super(start_node, {operator}, children);
	}
}
