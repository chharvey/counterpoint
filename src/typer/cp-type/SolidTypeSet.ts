import {
	SolidObject,
	SolidSet,
} from './package.js';
import {Type} from './Type.js';



export class SolidTypeSet extends Type {
	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new SolidTypeSet object.
	 * @param types a union of types in this set type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		readonly types: Type,
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

	protected override isSubtypeOf_do(t: Type): boolean {
		return t.equals(Type.OBJ) || (
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
