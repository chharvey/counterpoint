import * as assert from 'node:assert';
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



interface InstrVisitorMethods<T> {
	visitDrop                  (instr: Drop):                  T;
	visitDecl                  (instr: Decl):                  T;
	visitSet                   (instr: OpSet):                 T;
	visitCollectionDynamicSet  (instr: CollectionDynamicSet):  T;
	visitCollectionDynamicCopy (instr: CollectionDynamicCopy): T;

	defaultVisit(instr: Instruction): T;
}
export class InstrVisitor<T> {
	public constructor(private readonly methods: Partial<InstrVisitorMethods<T>>) {}

	/** @final */
	public visit(instr: Instruction): T {
		switch (instr.constructor) {
			case Drop:                  { return this.methods.visitDrop                  ?.(instr as Drop)                  ?? this.methods.defaultVisit?.(instr) ?? assert.fail('Missing implementation.'); }
			case Decl:                  { return this.methods.visitDecl                  ?.(instr as Decl)                  ?? this.methods.defaultVisit?.(instr) ?? assert.fail('Missing implementation.'); }
			case OpSet:                 { return this.methods.visitSet                   ?.(instr as OpSet)                 ?? this.methods.defaultVisit?.(instr) ?? assert.fail('Missing implementation.'); }
			case CollectionDynamicSet:  { return this.methods.visitCollectionDynamicSet  ?.(instr as CollectionDynamicSet)  ?? this.methods.defaultVisit?.(instr) ?? assert.fail('Missing implementation.'); }
			case CollectionDynamicCopy: { return this.methods.visitCollectionDynamicCopy ?.(instr as CollectionDynamicCopy) ?? this.methods.defaultVisit?.(instr) ?? assert.fail('Missing implementation.'); }
			default:                    { return                                                                               this.methods.defaultVisit?.(instr) ?? assert.fail('Unexpected subclass.'); }
		}
	}
}



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
