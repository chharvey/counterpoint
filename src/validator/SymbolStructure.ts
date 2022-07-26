import {
	TYPE,
	SolidObject,
} from './package.js';
import type * as AST from './astnode-cp/index.js';



/** Kinds of symbols. */
export enum SymbolKind {
	/** A value variable (a variable holding a Solid Language Value). */
	VALUE = 'value',
	/** A type variable / type alias. */
	TYPE  = 'type',
}



export abstract class SymbolStructure {
	constructor (
		/** The unique identifier of the symbol, the cooked value of the token. */
		readonly id: bigint,
		/** The 0-based line index of where the symbol was declared. */
		readonly line: number,
		/** The 0-based column index of where the symbol was declared. */
		readonly col: number,
		/** The source text of the symbol. */
		readonly source: string,
	) {
	}
}



export class SymbolStructureType extends SymbolStructure {
	/** The assessed value of the symbol. */
	typevalue: TYPE.SolidType = TYPE.SolidType.UNKNOWN;
	constructor (
		node: AST.ASTNodeTypeAlias,
	) {
		super(node.id, node.line_index, node.col_index, node.source);
	}
}



export class SymbolStructureVar extends SymbolStructure {
	/** The variable’s Type. */
	type: TYPE.SolidType = TYPE.SolidType.UNKNOWN;
	/** The assessed value of the symbol, or `null` if it cannot be statically determined or if the symbol is unfixed. */
	value: SolidObject | null = null;
	constructor (
		node: AST.ASTNodeVariable,
		/** May the symbol be reassigned? */
		readonly unfixed: boolean,
	) {
		super(node.id, node.line_index, node.col_index, node.source);
	}
}
