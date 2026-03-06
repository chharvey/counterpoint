import {IrNode} from './IrNode.ts';



/**
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
export abstract class Instruction extends IrNode {
}
