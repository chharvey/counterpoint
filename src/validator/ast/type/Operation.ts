import {
	type NonemptyArray,
	assert_instanceof,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {ValidTypeOperator} from '../../Operator.ts';
import {Type} from './Type.ts';



/**
 * Known subclasses:
 * - OperationUnary
 * - OperationBinary
 */
export abstract class Operation extends Type {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Operation {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, Operation);
		return typ;
	}

	public constructor(
		start_node:
			| SyntaxNodeType<'type_unary_symbol'>
			| SyntaxNodeType<'type_unary_keyword'>
			| SyntaxNodeType<'type_intersection'>
			| SyntaxNodeType<'type_union'>,

		protected readonly operator: ValidTypeOperator,
		public override readonly children: Readonly<NonemptyArray<Type>>,
	) {
		super(start_node, {operator}, children);
	}
}
