import {Opcode} from './Opcode.ts';



/**
 * An Instruction is what can be pushed to a CFG Node’s instruction array.
 *
 * Known subclasses:
 * - Drop
 * - Decl
 * - Set
 * - CollectionDynamicSet
 * - CollectionDynamicCopy
 */
export abstract class Instruction extends Opcode {
}
