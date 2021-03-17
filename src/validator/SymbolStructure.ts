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
	private was_value_set: boolean = false;
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
	set value(v: SolidLanguageType) {
		if (!this.was_value_set) {
			this.was_value_set = true;
			this._value = v;
		};
	}
}



export class SymbolStructureVar extends SymbolStructure {
	private was_type_set:  boolean = false;
	private was_value_set: boolean = false;
	constructor (
		id: bigint,
		line: number,
		col: number,
		/** May the symbol be reassigned? */
		readonly unfixed: boolean,
		/** The variable’s Type. */
		private _type: SolidLanguageType,
		/** The assessed value of the symbol, or `null` if it cannot be statically determined or if the symbol is unfixed. */
		private _value: SolidObject | null,
	) {
		super(id, line, col);
	}
	get type(): SolidLanguageType {
		return this._type;
	}
	set type(t: SolidLanguageType) {
		if (!this.was_type_set) {
			this.was_type_set = true;
			this._type = t;
		};
	}
	get value(): SolidObject | null {
		return this._value;
	}
	set value(v: SolidObject | null) {
		if (!this.unfixed && !this.was_value_set) {
			this.was_value_set = true;
			this._value = v;
		};
	}
}
