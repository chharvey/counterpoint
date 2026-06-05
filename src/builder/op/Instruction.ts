import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
import type {Interpreter} from '../Interpreter.ts';
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
	 * Execute the interpreter.
	 * @returns a runtime value in the interpreter
	 */
	public interpret(_interp: Interpreter): void { // TODO: abstractify this method
		throw new Error(`\`${ this.constructor.name }#interpret\` is not yet supported.`);
	}

	/**
	 * Generate assembly code.
	 * @param  cg code-generator
	 * @return    a binaryen expression of empty type (“`binaryen.none`”, not the WASM `none` heap type)
	 */
	public abstract codegen(cg: CodeGenerator): binaryen.ExpressionRef;
}
