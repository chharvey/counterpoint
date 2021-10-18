import {strictEqual} from './package.js';
import {
	SolidObject,
	SolidSet,
} from './index.js';
import {SolidType} from './SolidType.js';



export class SolidTypeSet extends SolidType {
	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new SolidTypeSet object.
	 * @param types a union of types in this set type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		readonly types: SolidType,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new SolidSet()]));
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.types.hasMutable;
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Set.<${ this.types }>`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidSet && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@SolidType.subtypeDeco
	override isSubtypeOf(t: SolidType): boolean {
		return t.equals(SolidType.OBJ) || (
			t instanceof SolidTypeSet
			&& ((t.isMutable)
				? this.isMutable && this.types.equals(t.types)
				: this.types.isSubtypeOf(t.types)
			)
		);
	}

	override mutableOf(): SolidTypeSet {
		return new SolidTypeSet(this.types, true);
	}

	override immutableOf(): SolidTypeSet {
		return new SolidTypeSet(this.types, false);
	}
}
