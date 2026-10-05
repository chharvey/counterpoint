import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import type {Interpreter} from '../Interpreter.ts';
import {
	Drop,
	Decl,
	Set as OpSet,
	CollectionDynamicSet,
	CollectionDynamicCopy,
} from './index.ts';
import {Opcode} from './Opcode.ts';



export abstract class InstrVisitor<T> {
	/* eslint-disable @stylistic/space-before-function-paren */
	public visitDrop                  (instr: Drop):                  T { return this.defaultVisit(instr); }
	public visitDecl                  (instr: Decl):                  T { return this.defaultVisit(instr); }
	public visitSet                   (instr: OpSet):                 T { return this.defaultVisit(instr); }
	public visitCollectionDynamicSet  (instr: CollectionDynamicSet):  T { return this.defaultVisit(instr); }
	public visitCollectionDynamicCopy (instr: CollectionDynamicCopy): T { return this.defaultVisit(instr); }
	/* eslint-enable @stylistic/space-before-function-paren */

	public abstract defaultVisit(instr: Instruction): T;

	/** @final */
	public visit(instr: Instruction): T {
		switch (instr.constructor) {
			case Drop:                  { return this.visitDrop                  (instr as Drop); }
			case Decl:                  { return this.visitDecl                  (instr as Decl); }
			case OpSet:                 { return this.visitSet                   (instr as OpSet); }
			case CollectionDynamicSet:  { return this.visitCollectionDynamicSet  (instr as CollectionDynamicSet); }
			case CollectionDynamicCopy: { return this.visitCollectionDynamicCopy (instr as CollectionDynamicCopy); }

			default: { return this.defaultVisit(instr); }
		}
	}
}



/**
 * An Instruction is what can be pushed to a CFG Node’s instruction array.
 *
 * Known subclasses:
 * - Drop
 * - Decl
 * - OpSet
 * - CollectionDynamicSet
 * - CollectionDynamicCopy
 */
export abstract class Instruction extends Opcode {
	/**
	 * Execute the interpreter.
	 * @param interp an Interpreter
	 */
	public abstract interpret(interp: Interpreter): void;

	/**
	 * Generate assembly code.
	 * @param  cg code-generator
	 * @return    a binaryen expression of empty type (“`binaryen.none`”, not the WASM `none` heap type)
	 */
	public abstract codegen(cg: CodeGenerator): binaryen.ExpressionRef;
}
