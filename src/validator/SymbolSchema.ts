import {TYPE} from '../typer/index.ts';
import type {Serializable} from '../parser/index.ts';



/** Kinds of symbols. */
export enum SymbolKind {
	/** A value variable (a variable holding a Counterpoint Language Value). */
	VALUE = 'value',
	/** A type variable / type alias. */
	TYPE  = 'type', // eslint-disable-line @typescript-eslint/no-shadow --- not a variable declaration
}



export abstract class SymbolSchema {
	public constructor(
		/** The unique identifier of the symbol, the cooked value of the token. */
		public readonly id: bigint,
		/** The 0-based line index of where the symbol was declared. */
		public readonly line: number,
		/** The 0-based column index of where the symbol was declared. */
		public readonly col: number,
		/** The source text of the symbol. */
		public readonly source: string,
	) {
	}
}



export class SymbolSchemaType extends SymbolSchema {
	/** The assessed value of the symbol. */
	public typevalue: TYPE.Type = TYPE.ANYTHING;

	public constructor(id: bigint, node: Serializable) {
		super(id, node.line_index, node.col_index, node.source);
	}
}



export class SymbolSchemaVar extends SymbolSchema {
	/**
	 * The variable’s assignee type.
	 * This is the type declared in the annotation (or inferred on initialization).
	 */
	public type: TYPE.Type = TYPE.ANYTHING;

	/**
	 * A volatile storage for creating OP codes in the IR.
	 * Represents the variable’s assigned IR value type.
	 * This will typically be narrower than the assignee type
	 * (except in cases of optional variables).
	 * @deprecated
	 */
	public irType: TYPE.Type = TYPE.NOTHING;

	public constructor(
		id:   bigint,
		node: Serializable,
		/** May the symbol be reassigned? */
		public readonly isWritable: boolean,
		/** Was the symbol declared without an initial value? */
		public readonly isUninitialized: boolean,
	) {
		super(id, node.line_index, node.col_index, node.source);
	}
}



/** The symbol of a declared function. */
export class SymbolSchemaFunc extends SymbolSchema {
	/** The declared function type. */
	public type: TYPE.Type = TYPE.ANYTHING;


	public constructor(id: bigint, node: Serializable) {
		super(id, node.line_index, node.col_index, node.source);
	}
}
