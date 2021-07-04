import {
	runOnceMethod,
} from '../decorators';
import {
	SolidType,
	SolidObject,
} from '../typer/';



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
	/** The assessed value of the symbol. */
	private _value: SolidType = SolidType.UNKNOWN;
	constructor (
		id:     bigint,
		line:   number,
		col:    number,
		source: string,
		/** A lambda returning the assessed value of the symbol. */
		private readonly value_setter: () => SolidType,
	) {
		super(id, line, col, source);
	}
	get value(): SolidType {
		return this._value;
	}
	/** @implements SymbolStructure */
	@runOnceMethod
	assess(): void {
		this._value = this.value_setter();
	}
}



export class SymbolStructureVar extends SymbolStructure {
	/** The variable’s Type. */
	private _type: SolidType = SolidType.UNKNOWN;
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
		private type_setter: () => SolidType,
		/** A lambda returning the assessed value of the symbol, or `null` if it cannot be statically determined or if the symbol is unfixed. */
		private value_setter: (() => SolidObject | null) | null,
	) {
		super(id, line, col, source);
	}
	get type(): SolidType {
		return this._type;
	}
	get value(): SolidObject | null {
		return this._value;
	}
	/** @implements SymbolStructure */
	@runOnceMethod
	assess(): void {
		this._type = this.type_setter();
		if (!this.unfixed && !!this.value_setter) {
			this._value = this.value_setter();
		};
	}
}
