import {SolidType} from './SolidType.js';
import {SolidObject} from './SolidObject.js';
import {SolidMapping} from './SolidMapping.js';



export class SolidTypeMapping extends SolidType {
	override readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeMapping object.
	 * @param antecedenttypes a union of antecedent types in this mapping type
	 * @param consequenttypes a union of consequent types in this mapping type
	 */
	constructor (
		readonly antecedenttypes: SolidType,
		readonly consequenttypes: SolidType,
	) {
		super(new Set([new SolidMapping()]));
	}

	override toString(): string {
		return `Mapping.<${ this.antecedenttypes }, ${ this.consequenttypes }>`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidMapping && v.toType().isSubtypeOf(this);
	}

	override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeMapping
			&& this.antecedenttypes.isSubtypeOf(t.antecedenttypes)
			&& this.consequenttypes.isSubtypeOf(t.consequenttypes)
		);
	}
}
