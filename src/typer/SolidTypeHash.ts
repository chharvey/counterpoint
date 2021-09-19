import {
	strictEqual,
} from '../decorators.js';
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
	 */
	constructor (
		readonly types: SolidType,
	) {
		super(SolidHash.values);
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

	@strictEqual
	@SolidType.subtypeDeco
	override isSubtypeOf(t: SolidType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeHash
			&& this.types.isSubtypeOf(t.types)
		);
	}
}
