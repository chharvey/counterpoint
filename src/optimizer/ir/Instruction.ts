import type {IrNode} from './IrNode.ts';



/**
 * Known implementers:
 * - Drop
 * - Decl
 * - Set
 * - CollectionDynamicSet
 * - CollectionDynamicCopy
 * - Label
 * - Goto
 * - GotoIfFalse
 */
export interface Instruction extends IrNode { // eslint-disable-line @typescript-eslint/no-empty-object-type
}
