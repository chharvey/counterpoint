import {
	SolidObject,
	SolidMap,
} from './index.js';
import {SolidType} from './SolidType.js';



export class SolidTypeMap extends SolidType {
	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new SolidTypeMap object.
	 * @param antecedenttypes a union of antecedent types in this map type
	 * @param consequenttypes a union of consequent types in this map type
	 */
	constructor (
		readonly antecedenttypes: SolidType,
		readonly consequenttypes: SolidType,
	) {
		super(SolidMap.values);
	}

	override toString(): string {
		return `Map.<${ this.antecedenttypes }, ${ this.consequenttypes }>`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidMap && v.toType().isSubtypeOf(this);
	}

	override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeMap
			&& this.antecedenttypes.isSubtypeOf(t.antecedenttypes)
			&& this.consequenttypes.isSubtypeOf(t.consequenttypes)
		);
	}
}
