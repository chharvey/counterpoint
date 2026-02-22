import type {TYPE} from '../../typer/index.ts';
import {Instruction} from './Instruction.ts';



export abstract class Value extends Instruction {
	public abstract get type(): TYPE.Type;
}
