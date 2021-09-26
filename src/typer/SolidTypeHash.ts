import {
	SolidObject,
	SolidRecord,
	SolidHash,
} from './index.js';
import {SolidType} from './SolidType.js';



export class SolidTypeHash extends SolidType {
	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new SolidTypeHash object.
	 * @param types a union of types in this hash type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		readonly types: SolidType,
		is_mutable: boolean = false,
	) {
		super(is_mutable, SolidHash.values);
	}

	override toString(): string {
		return `Hash.<${ this.types }>`;
	}

	override includes(v: SolidObject): boolean {
		return (
			   v instanceof SolidHash   && v.toType().isSubtypeOf(this)
			|| v instanceof SolidRecord && v.toType().isSubtypeOf(this)
		);
	}

	override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeHash
			&& this.types.isSubtypeOf(t.types)
		);
	}

	override mutableOf(): SolidTypeHash {
		return new SolidTypeHash(this.types, true);
	}
}
