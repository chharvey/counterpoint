import {Instruction} from './Instruction.ts';



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

	INT_NEG,
	FLOAT_NEG,

	TOBOOL,
	TOINT,
	TONAT,
	TOFLOAT,

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
}



/**
 * An Opcode is an IrNode witha an OpCode.
 *
 * Known subclasses:
 * - Value
 * - Drop
 * - Decl
 * - Set
 * - CollectionDynamicSet
 * - CollectionDynamicCopy
 */
export abstract class Opcode extends Instruction {
	public constructor(private readonly opCode: OpCode) {
		super();
	}

	/** @final */
	public override toString(...args: readonly {toString(): string}[]): string {
		return `(${ [OpCode[this.opCode].replace(/_/, '.'), ...args].join(' ') })`;
	}
}
