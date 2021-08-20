import {
	strictEqual,
} from '../decorators.js';
import {
	SolidObject,
	SolidSet,
} from '../index.js'; // avoids circular imports
import {SolidType} from './SolidType.js';



export class SolidTypeSet extends SolidType {
	override readonly isBottomType: boolean = false;

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

	@strictEqual
	@SolidType.subtypeDeco
	override isSubtypeOf(t: SolidType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeSet
			&& this.types.isSubtypeOf(t.types)
		);
	}
}
