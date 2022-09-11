import {
	SolidObject,
	SolidMap,
} from './index.js';
import {SolidType} from './SolidType.js';
import {SolidTypeUnit} from './SolidTypeUnit.js';



export class SolidTypeMap extends SolidType {
	/**
	 * Is the argument a unit map type?
	 * @return whether the argument is a `SolidTypeUnit` and its value is a `SolidMap`
	 */
	static isUnitType(type: SolidType): type is SolidTypeUnit<SolidMap> {
		return type instanceof SolidTypeUnit && type.value instanceof SolidMap;
	}


	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new SolidTypeMap object.
	 * @param antecedenttypes a union of antecedent types in this map type
	 * @param consequenttypes a union of consequent types in this map type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		readonly antecedenttypes: SolidType,
		readonly consequenttypes: SolidType,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new SolidMap()]));
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.antecedenttypes.hasMutable || this.consequenttypes.hasMutable;
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Map.<${ this.antecedenttypes }, ${ this.consequenttypes }>`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidMap && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidType.OBJ) || (
			t instanceof SolidTypeMap
			&& ((t.isMutable)
				? this.isMutable && this.antecedenttypes.equals(t.antecedenttypes) && this.consequenttypes.equals(t.consequenttypes)
				: this.antecedenttypes.isSubtypeOf(t.antecedenttypes) && this.consequenttypes.isSubtypeOf(t.consequenttypes)
			)
		);
	}

	override mutableOf(): SolidTypeMap {
		return new SolidTypeMap(this.antecedenttypes, this.consequenttypes, true);
	}

	override immutableOf(): SolidTypeMap {
		return new SolidTypeMap(this.antecedenttypes, this.consequenttypes, false);
	}
}
