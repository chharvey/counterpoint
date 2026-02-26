import type {TYPE} from '../../typer/index.ts';
import {Instruction} from './Instruction.ts';



/**
 * An Instruction to the internal representation (IR).
 *
 * Known subclasses:
 * - Trap
 * - Const
 * - Get
 * - CollectionLinearNew
 * - RecordNew
 * - DictNew
 * - MapNew
 * - TupleGet
 * - RecordGet
 * - CollectionDynamicGet
 * - CollectionHashedGet
 * - Unop
 * - Binop
 */
export abstract class Value extends Instruction {
	/**
	 * @param type The type of the expression.
	 */
	public constructor(public readonly type: TYPE.Type) {
		super();
	}
}
