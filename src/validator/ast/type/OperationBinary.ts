import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {ValidTypeOperator} from '../../Operator.ts';
import type {Type} from './Type.ts';
import {Operation} from './Operation.ts';



export class OperationBinary extends Operation {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationBinary {
		const typ: Operation = Operation.fromSource(src, config);
		assert_instanceof(typ, OperationBinary);
		return typ;
	}

	public constructor(
		start_node:
			| SyntaxNodeType<'type_intersection'>
			| SyntaxNodeType<'type_union'>,

		operator: ValidTypeOperator,
		private readonly operand0: Type,
		private readonly operand1: Type,
	) {
		super(start_node, operator, [operand0, operand1]);
	}
}
