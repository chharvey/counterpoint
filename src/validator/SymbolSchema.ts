import {
	TYPE,
	type ClassSignature,
} from '../typer/index.ts';
import type {Serializable} from '../parser/index.ts';



/** Kinds of symbols. */
export enum SymbolKind {
	/** A type variable / type alias. */
	TYPE  = 'type', // eslint-disable-line @typescript-eslint/no-shadow --- not a variable declaration
	/** A value variable (a variable holding a Counterpoint Language Value). */
	VALUE = 'value',
	/** A declared function. */
	FUNC  = 'function',
}



export abstract class SymbolSchema {
	/** Does this symbol persist across lexical boundaries? */
	public readonly persists: boolean = false;


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
	/** Types persist because they are erased before compilation. */
	public override readonly persists = true;

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
	/** Function declarations persist because they are not objects at runtime. */
	public override readonly persists = true;

	/** The declared function types (one per overload). */
	public readonly types: TYPE.Function[] = [];


	public constructor(id: bigint, node: Serializable) {
		super(id, node.line_index, node.col_index, node.source);
	}
}



/** The symbol of a declared class. */
export class SymbolSchemaClass extends SymbolSchema {
	/**
	 * NOTE: Only intrinsic classes persist because they are in the core library.
	 * User-defined classes do not persist.
	 * TODO: update once we get custom classes.
	 */
	public override readonly persists = true;

	public constructor(
		id: bigint,
		classname: string,
		/** The declared class’s call signature type. */
		public readonly classSignature: ClassSignature,
	) {
		super(id, 0, 0, classname);
	}
}
