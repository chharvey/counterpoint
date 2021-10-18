import {strictEqual} from './package.js';
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
		super(is_mutable, new Set([new SolidHash()]));
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.types.hasMutable;
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Hash.<${ this.types }>`;
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
		return t.equals(SolidType.OBJ) || (
			t instanceof SolidTypeHash
			&& ((t.isMutable)
				? this.isMutable && this.types.equals(t.types)
				: this.types.isSubtypeOf(t.types)
			)
		);
	}

	override mutableOf(): SolidTypeHash {
		return new SolidTypeHash(this.types, true);
	}

	override immutableOf(): SolidTypeHash {
		return new SolidTypeHash(this.types, false);
	}
}
