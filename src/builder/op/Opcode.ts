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

	TUPLE_GET,
	RECORD_GET,
	LIST_GET,
	DICT_GET,
	SET_GET,
	MAP_GET,

	CALL,

	ISNULL,

	NOT,
	EMP,
	NEG,

	TOBOOL,
	TOINT,
	TONAT,
	TOFLOAT,

	LIST_COUNT,
	DICT_COUNT,
	SET_COUNT,
	MAP_COUNT,

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
	NLT,
	NGT,

	ID,
	EQ,
	NID,
	NEQ,

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
	public validate(): void {
		return;
	}
}
