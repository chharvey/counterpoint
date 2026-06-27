import type {TYPE} from '../../typer/index.ts';
import {Value} from './Value.ts';
import type {OpCode} from './Opcode.ts';



/**
 * A value in Three-Address Code format.
 * See {@link Value.asTac} for details.
 *
 * Known subclasses:
 * - Trap
 * - Const
 * - Get
 */
export abstract class ValueTac extends Value {
	public constructor(op_code: OpCode, type: TYPE.Type) {
		super(op_code, type);
	}
}
