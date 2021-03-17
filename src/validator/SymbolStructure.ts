import {
	runOnceSetter,
} from '../decorators';
import type {SolidLanguageType} from './SolidLanguageType';
import type {SolidObject} from './SolidObject';



/** Kinds of symbols. */
export enum SymbolKind {
	/** A value variable (a variable holding a Solid Language Value). */
	VALUE,
	/** A type variable / type alias. */
	TYPE,
}



export class SymbolStructure {
	constructor (
		/** The unique identifier of the symbol, the cooked value of the token. */
		readonly id: bigint,
		/** The 0-based line index of where the symbol was declared. */
		readonly line: number,
		/** Tthe 0-based column index of where the symbol was declared. */
		readonly col: number,
	) {
	}
}



export class SymbolStructureType extends SymbolStructure {
	constructor (
		id: bigint,
		line: number,
		col: number,
		/** The assessed value of the symbol. */
		private _value: SolidLanguageType,
	) {
		super(id, line, col);
	}
	get value(): SolidLanguageType {
		return this._value;
	}
	@runOnceSetter
	set value(v: SolidLanguageType) {
		this._value = v;
	}
}



export class SymbolStructureVar extends SymbolStructure {
	constructor (
		id: bigint,
		line: number,
		col: number,
		/** The variable’s Type. */
		readonly type: SolidLanguageType,
		/** May the symbol be reassigned? */
		readonly unfixed: boolean,
		/** The assessed value of the symbol, or `null` if it cannot be statically determined or if the symbol is unfixed. */
		private _value: SolidObject | null,
	) {
		super(id, line, col);
	}
	get value(): SolidObject | null {
		return this._value;
	}
	@runOnceSetter
	set value(v: SolidObject | null) {
		if (!this.unfixed) {
			this._value = v;
		};
	}
}
