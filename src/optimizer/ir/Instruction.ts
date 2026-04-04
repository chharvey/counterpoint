import {Opcode} from './Opcode.ts';



/**
 * An Instruction is what can be pushed to an Optimizer’s instruction array.
 *
 * Known subclasses:
 * - Drop
 * - Decl
 * - Set
 * - CollectionDynamicSet
 * - CollectionDynamicCopy
 * - Label
 * - Goto
 * - GotoIfFalse
 */
export abstract class Instruction extends Opcode {
}
