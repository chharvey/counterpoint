import {
	SolidObject,
	SolidMap,
} from './package.js';
import {Type} from './Type.js';



export class SolidTypeMap extends Type {
	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new SolidTypeMap object.
	 * @param antecedenttypes a union of antecedent types in this map type
	 * @param consequenttypes a union of consequent types in this map type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		readonly antecedenttypes: Type,
		readonly consequenttypes: Type,
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

	protected override isSubtypeOf_do(t: Type): boolean {
		return t.equals(Type.OBJ) || (
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
