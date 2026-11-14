import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {ValidTypeOperator} from '../../Operator.ts';
import type {Type} from './Type.ts';
import {Operation} from './Operation.ts';



export class OperationUnary extends Operation {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationUnary {
		const typ: Operation = Operation.fromSource(src, config);
		assert_instanceof(typ, OperationUnary);
		return typ;
	}

	public constructor(
		start_node:
			| SyntaxNodeType<'type_unary_symbol'>
			| SyntaxNodeType<'type_unary_keyword'>,

		operator: ValidTypeOperator,
		public readonly operand: Type,
	) {
		super(start_node, operator, [operand]);
	}
}
