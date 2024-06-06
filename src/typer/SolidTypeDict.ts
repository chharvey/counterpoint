import {
	SolidObject,
	SolidDict,
} from './index.js';
import {SolidType} from './SolidType.js';
import {SolidTypeUnit} from './SolidTypeUnit.js';



export class SolidTypeDict extends SolidType {
	/**
	 * Is the argument a unit dict type?
	 * @return whether the argument is a `SolidTypeUnit` and its value is a `SolidDict`
	 */
	static isUnitType(type: SolidType): type is SolidTypeUnit<SolidDict> {
		return type instanceof SolidTypeUnit && type.value instanceof SolidDict;
	}


	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new SolidTypeDict object.
	 * @param types a union of types in this dict type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		readonly types: SolidType,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new SolidDict()]));
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.types.hasMutable;
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Dict.<${ this.types }>`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidDict && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidType.OBJ) || (
			t instanceof SolidTypeDict
			&& ((t.isMutable)
				? this.isMutable && this.types.equals(t.types)
				: this.types.isSubtypeOf(t.types)
			)
		);
	}

	override mutableOf(): SolidTypeDict {
		return new SolidTypeDict(this.types, true);
	}

	override immutableOf(): SolidTypeDict {
		return new SolidTypeDict(this.types, false);
	}
}
