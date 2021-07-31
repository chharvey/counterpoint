import {
	SolidObject,
	SolidSet,
} from '../index.js'; // avoids circular imports
import {SolidType} from './SolidType.js';



export class SolidTypeSet extends SolidType {
	override readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeSet object.
	 * @param types a union of types in this set type
	 */
	constructor (
		readonly types: SolidType,
	) {
		super(SolidSet.values);
	}

	override toString(): string {
		return `Set.<${ this.types }>`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidSet && v.toType().isSubtypeOf(this);
	}
}
