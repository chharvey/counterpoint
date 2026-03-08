import {OpCode} from './utils-public.ts';
import {Instruction} from './Instruction.ts';



/**
 * An Opcode is an IrNode witha an OpCode.
 *
 * Known subclasses:
 * - Value
 * - Drop
 * - Decl
 * - Set
 * - CollectionDynamicSet
 * - CollectionDynamicCopy
 */
export abstract class Opcode extends Instruction {
	public constructor(private readonly opCode: OpCode) {
		super();
	}

	/** @final */
	public override toString(...args: readonly {toString(): string}[]): string {
		return `(${ [OpCode[this.opCode].replace(/_/, '.'), ...args].join(' ') })`;
	}
}
