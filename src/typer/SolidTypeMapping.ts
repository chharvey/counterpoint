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
		private readonly antecedenttypes: SolidType,
		private readonly consequenttypes: SolidType,
	) {
		super(new Set([new SolidMapping()]));
	}

	override toString(): string {
		return `Mapping.<${ this.antecedenttypes }, ${ this.consequenttypes }>`;
	}

	override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeMapping
			&& this.antecedenttypes.isSubtypeOf(t.antecedenttypes)
			&& this.consequenttypes.isSubtypeOf(t.consequenttypes)
		);
	}
}
