import * as assert from 'node:assert';
import type {Builder} from '../Builder.ts';
import {
	Value,
	Trap,
	Const,
	Get,
	Template,
	CollectionLinearNew,
	RecordNew,
	DictNew,
	MapNew,
	MaybeNew,
	TupleGet,
	RecordGet,
	CollectionDynamicGet,
	Call,
	Unop,
	Instance,
	Binop,
	Instruction,
	Drop,
	Decl,
	Set as OpSet,
	CollectionDynamicSet,
	CollectionDynamicCopy,
	Terminator,
	Goto,
	GotoConditional,
	EndProgram,
} from './index.ts';



/**
 * An abstract operation code.
 * Models the concept of opcodes in a VM, but for the high-level IR instead.
 */
export enum OpCode {
	TRAP,

	NULL_CONST,
	BOOL_CONST,
	SYM_CONST,
	INT_CONST,
	NAT_CONST,
	FLOAT_CONST,
	STR_CONST,

	STR_TEMPLATE,

	GET,

	TUPLE_NEW,
	RECORD_NEW,
	LIST_NEW,
	DICT_NEW,
	SET_NEW,
	MAP_NEW,
	MAYBE_NEW,

	TUPLE_GET,
	RECORD_GET,
	LIST_GET,
	DICT_GET,
	SET_GET,
	MAP_GET,

	CALL,

	BOOL_FROM,
	INT_FROM,
	NAT_FROM,
	FLOAT_FROM,
	STR_FROM,

	NOT,
	EMP,
	NEG,

	LIST_COUNT,
	DICT_COUNT,
	SET_COUNT,
	MAP_COUNT,

	MAYBE_UNWRAP,

	INSTANCEOF,
	CAST,

	INT_ADD,
	INT_SUB,
	INT_MUL,
	INT_DIV,
	INT_EXP,

	NAT_ADD,
	NAT_SUB,
	NAT_MUL,
	NAT_DIV,
	NAT_EXP,

	FLOAT_ADD,
	FLOAT_SUB,
	FLOAT_MUL,
	FLOAT_DIV,
	FLOAT_EXP,

	LT,
	GT,
	LE,
	GE,

	ID,
	EQ,
	/** @deprecated Phi nodes are unused for now but may be used later when we add SSA. SSA will be implemented as an IR optimization later. */
	PHI,

	DROP,
	DECL,
	SET,

	LIST_SET,
	DICT_SET,
	SET_SET,
	MAP_SET,

	LIST_COPY,
	DICT_COPY,
	SET_COPY,
	MAP_COPY,

	GOTO,
	GOTO_IF,
	ENDPROGRAM,
}



interface OpcodeVisitorMethods<T> {
	visitTrap                 (val: Trap):                 T;
	visitConst                (val: Const):                T;
	visitGet                  (val: Get):                  T;
	visitTemplate             (val: Template):             T;
	visitCollectionLinearNew  (val: CollectionLinearNew):  T;
	visitRecordNew            (val: RecordNew):            T;
	visitDictNew              (val: DictNew):              T;
	visitMapNew               (val: MapNew):               T;
	visitMaybeNew             (val: MaybeNew):             T;
	visitTupleGet             (val: TupleGet):             T;
	visitRecordGet            (val: RecordGet):            T;
	visitCollectionDynamicGet (val: CollectionDynamicGet): T;
	visitCall                 (val: Call):                 T;
	visitUnop                 (val: Unop):                 T;
	visitInstance             (val: Instance):             T;
	visitBinop                (val: Binop):                T;
	visitValue                (val: Value):                T;

	visitDrop                  (instr: Drop):                  T;
	visitDecl                  (instr: Decl):                  T;
	visitSet                   (instr: OpSet):                 T;
	visitCollectionDynamicSet  (instr: CollectionDynamicSet):  T;
	visitCollectionDynamicCopy (instr: CollectionDynamicCopy): T;
	visitInstruction           (instr: Instruction):           T;

	visitGoto            (term: Goto):            T;
	visitGotoConditional (term: GotoConditional): T;
	visitEndProgram      (term: EndProgram):      T;
	visitTerminator      (term: Terminator):      T;

	defaultVisit(op: Opcode): T;
}
export class OpcodeVisitor<T> {
	public constructor(private readonly methods: Partial<OpcodeVisitorMethods<T>>) {}

	/** @final */
	public visit(op: Opcode): T {
		switch (op.constructor) {
			case Trap:                  { return this.methods.visitTrap                 ?.(op as Trap)                 ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case Const:                 { return this.methods.visitConst                ?.(op as Const)                ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case Get:                   { return this.methods.visitGet                  ?.(op as Get)                  ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case Template:              { return this.methods.visitTemplate             ?.(op as Template)             ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case CollectionLinearNew:   { return this.methods.visitCollectionLinearNew  ?.(op as CollectionLinearNew)  ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case RecordNew:             { return this.methods.visitRecordNew            ?.(op as RecordNew)            ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case DictNew:               { return this.methods.visitDictNew              ?.(op as DictNew)              ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case MapNew:                { return this.methods.visitMapNew               ?.(op as MapNew)               ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case MaybeNew:              { return this.methods.visitMaybeNew             ?.(op as MaybeNew)             ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case TupleGet:              { return this.methods.visitTupleGet             ?.(op as TupleGet)             ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case RecordGet:             { return this.methods.visitRecordGet            ?.(op as RecordGet)            ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case CollectionDynamicGet:  { return this.methods.visitCollectionDynamicGet ?.(op as CollectionDynamicGet) ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case Call:                  { return this.methods.visitCall                 ?.(op as Call)                 ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case Unop:                  { return this.methods.visitUnop                 ?.(op as Unop)                 ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case Instance:              { return this.methods.visitInstance             ?.(op as Instance)             ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case Binop:                 { return this.methods.visitBinop                ?.(op as Binop)                ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case Value:                 { return this.methods.visitValue                ?.(op as Value)                ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }

			case Drop:                  { return this.methods.visitDrop                  ?.(op as Drop)                  ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case Decl:                  { return this.methods.visitDecl                  ?.(op as Decl)                  ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case OpSet:                 { return this.methods.visitSet                   ?.(op as OpSet)                 ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case CollectionDynamicSet:  { return this.methods.visitCollectionDynamicSet  ?.(op as CollectionDynamicSet)  ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case CollectionDynamicCopy: { return this.methods.visitCollectionDynamicCopy ?.(op as CollectionDynamicCopy) ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case Instruction:           { return this.methods.visitInstruction           ?.(op as Instruction)           ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }

			case Goto:                  { return this.methods.visitGoto            ?.(op as Goto)            ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case GotoConditional:       { return this.methods.visitGotoConditional ?.(op as GotoConditional) ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case EndProgram:            { return this.methods.visitEndProgram      ?.(op as EndProgram)      ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }
			case Terminator:            { return this.methods.visitTerminator      ?.(op as Terminator)      ?? this.methods.defaultVisit?.(op) ?? assert.fail('Missing implementation.'); }

			default: { return this.methods.defaultVisit?.(op) ?? assert.fail('Unexpected subclass.'); }
		}
	}
}
/**
 * An Opcode is an operation of the virtual machine.
 *
 * Known subclasses:
 * - Value
 * - Instruction
 * - Terminator
 */
export abstract class Opcode {
	public constructor(private readonly opCode: OpCode) {
	}

	/** Represent this Opcode as a string for inspection. */
	public toString(...args: readonly {toString(): string}[]): string {
		return `(${ [OpCode[this.opCode].replace(/_/, '.'), ...args].join(' ') })`;
	}

	/** Type-validate this Opcode. Throws if invalid. */
	public validate(_builder: Builder): void {
		return;
	}
}
