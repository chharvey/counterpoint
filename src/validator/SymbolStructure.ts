import {SolidLanguageType} from './SolidLanguageType';
import type {SolidObject} from './SolidObject';



/** Kinds of symbols. */
export enum SymbolKind {
	/** A value variable (a variable holding a Solid Language Value). */
	VALUE,
	/** A type variable / type alias. */
	TYPE,
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
	/**
	 * Perform type and constant-folding assessments during semantic analysis.
	 */
	abstract assess(): void;
}



export class SymbolStructureType extends SymbolStructure {
	private was_evaluated: boolean = false;
	/** The assessed value of the symbol. */
	private _value: SolidLanguageType = SolidLanguageType.UNKNOWN;
	constructor (
		id:     bigint,
		line:   number,
		col:    number,
		source: string,
		/** A lambda returning the assessed value of the symbol. */
		private readonly value_setter: () => SolidLanguageType,
	) {
		super(id, line, col, source);
	}
	get value(): SolidLanguageType {
		return this._value;
	}
	/** @implements SymbolStructure */
	assess(): void {
		if (!this.was_evaluated) {
			this.was_evaluated = true;
			this._value = this.value_setter();
		};
	}
}



export class SymbolStructureVar extends SymbolStructure {
	private was_evaluated:  boolean = false;
	/** The variable’s Type. */
	private _type: SolidLanguageType = SolidLanguageType.UNKNOWN;
	/** The assessed value of the symbol, or `null` if it cannot be statically determined or if the symbol is unfixed. */
	private _value: SolidObject | null = null;
	constructor (
		id:     bigint,
		line:   number,
		col:    number,
		source: string,
		/** May the symbol be reassigned? */
		readonly unfixed: boolean,
		/** A lambda returning the variable’s Type. */
		private type_setter: () => SolidLanguageType,
		/** A lambda returning the assessed value of the symbol, or `null` if it cannot be statically determined or if the symbol is unfixed. */
		private value_setter: (() => SolidObject | null) | null,
	) {
		super(id, line, col, source);
	}
	get type(): SolidLanguageType {
		return this._type;
	}
	get value(): SolidObject | null {
		return this._value;
	}
	/** @implements SymbolStructure */
	assess(): void {
		if (!this.was_evaluated) {
			this.was_evaluated = true;
			this._type = this.type_setter();
			if (!this.unfixed && !!this.value_setter) {
				this._value = this.value_setter();
			};
		};
	}
}
