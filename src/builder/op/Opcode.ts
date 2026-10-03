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



export abstract class OpcodeVisitor<T> {
	/* eslint-disable @stylistic/space-before-function-paren */
	public visitTrap                 (val: Trap):                 T { return this.defaultVisit(val); }
	public visitConst                (val: Const):                T { return this.defaultVisit(val); }
	public visitGet                  (val: Get):                  T { return this.defaultVisit(val); }
	public visitTemplate             (val: Template):             T { return this.defaultVisit(val); }
	public visitCollectionLinearNew  (val: CollectionLinearNew):  T { return this.defaultVisit(val); }
	public visitRecordNew            (val: RecordNew):            T { return this.defaultVisit(val); }
	public visitDictNew              (val: DictNew):              T { return this.defaultVisit(val); }
	public visitMapNew               (val: MapNew):               T { return this.defaultVisit(val); }
	public visitMaybeNew             (val: MaybeNew):             T { return this.defaultVisit(val); }
	public visitTupleGet             (val: TupleGet):             T { return this.defaultVisit(val); }
	public visitRecordGet            (val: RecordGet):            T { return this.defaultVisit(val); }
	public visitCollectionDynamicGet (val: CollectionDynamicGet): T { return this.defaultVisit(val); }
	public visitCall                 (val: Call):                 T { return this.defaultVisit(val); }
	public visitUnop                 (val: Unop):                 T { return this.defaultVisit(val); }
	public visitInstance             (val: Instance):             T { return this.defaultVisit(val); }
	public visitBinop                (val: Binop):                T { return this.defaultVisit(val); }
	public visitValue                (val: Value):                T { return this.defaultVisit(val); }

	public visitDrop                  (instr: Drop):                  T { return this.defaultVisit(instr); }
	public visitDecl                  (instr: Decl):                  T { return this.defaultVisit(instr); }
	public visitSet                   (instr: OpSet):                 T { return this.defaultVisit(instr); }
	public visitCollectionDynamicSet  (instr: CollectionDynamicSet):  T { return this.defaultVisit(instr); }
	public visitCollectionDynamicCopy (instr: CollectionDynamicCopy): T { return this.defaultVisit(instr); }
	public visitInstruction           (instr: Instruction):           T { return this.defaultVisit(instr); }

	public visitGoto            (term: Goto):            T { return this.defaultVisit(term); }
	public visitGotoConditional (term: GotoConditional): T { return this.defaultVisit(term); }
	public visitEndProgram      (term: EndProgram):      T { return this.defaultVisit(term); }
	public visitTerminator      (term: Terminator):      T { return this.defaultVisit(term); }
	/* eslint-enable @stylistic/space-before-function-paren */

	public abstract defaultVisit(op: Opcode): T;

	/** @final */
	public visit(op: Opcode): T {
		switch (op.constructor) {
			case Trap:                  { return this.visitTrap                 (op as Trap); }
			case Const:                 { return this.visitConst                (op as Const); }
			case Get:                   { return this.visitGet                  (op as Get); }
			case Template:              { return this.visitTemplate             (op as Template); }
			case CollectionLinearNew:   { return this.visitCollectionLinearNew  (op as CollectionLinearNew); }
			case RecordNew:             { return this.visitRecordNew            (op as RecordNew); }
			case DictNew:               { return this.visitDictNew              (op as DictNew); }
			case MapNew:                { return this.visitMapNew               (op as MapNew); }
			case MaybeNew:              { return this.visitMaybeNew             (op as MaybeNew); }
			case TupleGet:              { return this.visitTupleGet             (op as TupleGet); }
			case RecordGet:             { return this.visitRecordGet            (op as RecordGet); }
			case CollectionDynamicGet:  { return this.visitCollectionDynamicGet (op as CollectionDynamicGet); }
			case Call:                  { return this.visitCall                 (op as Call); }
			case Unop:                  { return this.visitUnop                 (op as Unop); }
			case Instance:              { return this.visitInstance             (op as Instance); }
			case Binop:                 { return this.visitBinop                (op as Binop); }
			case Value:                 { return this.visitValue                (op as Value); }

			case Drop:                  { return this.visitDrop                  (op as Drop); }
			case Decl:                  { return this.visitDecl                  (op as Decl); }
			case OpSet:                 { return this.visitSet                   (op as OpSet); }
			case CollectionDynamicSet:  { return this.visitCollectionDynamicSet  (op as CollectionDynamicSet); }
			case CollectionDynamicCopy: { return this.visitCollectionDynamicCopy (op as CollectionDynamicCopy); }
			case Instruction:           { return this.visitInstruction           (op as Instruction); }

			case Goto:                  { return this.visitGoto            (op as Goto); }
			case GotoConditional:       { return this.visitGotoConditional (op as GotoConditional); }
			case EndProgram:            { return this.visitEndProgram      (op as EndProgram); }
			case Terminator:            { return this.visitTerminator      (op as Terminator); }

			default: { return this.defaultVisit(op); }
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
