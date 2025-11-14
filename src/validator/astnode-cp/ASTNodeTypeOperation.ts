import {
	type NonemptyArray,
	assert_instanceof,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ValidTypeOperator} from '../Operator.ts';
import {ASTNodeType} from './ASTNodeType.ts';



/**
 * Known subclasses:
 * - ASTNodeTypeOperationUnary
 * - ASTNodeTypeOperationBinary
 */
export abstract class ASTNodeTypeOperation extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeOperation {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeOperation);
		return typ;
	}

	public constructor(
		start_node:
			| SyntaxNodeType<'type_unary_symbol'>
			| SyntaxNodeType<'type_unary_keyword'>
			| SyntaxNodeType<'type_intersection'>
			| SyntaxNodeType<'type_union'>,

		protected readonly operator: ValidTypeOperator,
		public override readonly children: Readonly<NonemptyArray<ASTNodeType>>,
	) {
		super(start_node, {operator}, children);
	}
}
