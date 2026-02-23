import type {TYPE} from '../../typer/index.ts';
import {Instruction} from './Instruction.ts';



/**
 * An Instruction to the internal representation (IR).
 *
 * Known subclasses:
 * - Trap
 * - Const
 * - Get
 * - Unop
 * - Binop
 */
export abstract class Value extends Instruction {
	/** The type of the expression. */
	public abstract get type(): TYPE.Type;
}
