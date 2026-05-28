import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
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
	/**
	 * Generate assembly code.
	 * @param  cg code-generator
	 * @return    a binaryen expression of empty type (“`binaryen.none`”, not the WASM `none` heap type)
	 */
	public abstract codegen(cg: CodeGenerator): binaryen.ExpressionRef;
}
