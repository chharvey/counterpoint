import {
	TYPE,
	OBJ,
} from './package.js';
import type * as AST from './astnode-cp/index.js';



/** Kinds of symbols. */
export enum SymbolKind {
	/** A value variable (a variable holding a Counterpoint Language Value). */
	VALUE = 'value',
	/** A type variable / type alias. */
	TYPE  = 'type', // eslint-disable-line @typescript-eslint/no-shadow --- not a variable declaration
}



export abstract class SymbolStructure {
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



export class SymbolStructureType extends SymbolStructure {
	/** The assessed value of the symbol. */
	public typevalue: TYPE.Type = TYPE.UNKNOWN;
	public constructor(node: AST.ASTNodeTypeAlias) {
		super(node.id, node.line_index, node.col_index, node.source);
	}
}



export class SymbolStructureVar extends SymbolStructure {
	/** The variable’s Type. */
	public type: TYPE.Type = TYPE.UNKNOWN;
	/** The assessed value of the symbol, or `null` if it cannot be statically determined or if the symbol is unfixed. */
	public value: OBJ.Object | null = null;
	public constructor(
		node: AST.ASTNodeVariable,
		/** May the symbol be reassigned? */
		public readonly unfixed: boolean,
	) {
		super(node.id, node.line_index, node.col_index, node.source);
	}
}
