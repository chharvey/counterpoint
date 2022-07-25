import {
	SolidObject,
	SolidDict,
} from './package.js';
import {SolidType} from './SolidType.js';



export class SolidTypeDict extends SolidType {
	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new SolidTypeDict object.
	 * @param types a union of types in this dict type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		readonly types: SolidType,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new SolidDict()]));
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.types.hasMutable;
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Dict.<${ this.types }>`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidDict && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidType.OBJ) || (
			t instanceof SolidTypeDict
			&& ((t.isMutable)
				? this.isMutable && this.types.equals(t.types)
				: this.types.isSubtypeOf(t.types)
			)
		);
	}

	override mutableOf(): SolidTypeDict {
		return new SolidTypeDict(this.types, true);
	}

	override immutableOf(): SolidTypeDict {
		return new SolidTypeDict(this.types, false);
	}
}
