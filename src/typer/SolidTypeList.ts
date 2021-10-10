import {
	SolidObject,
	SolidTuple,
	SolidList,
} from './index.js';
import {SolidType} from './SolidType.js';



export class SolidTypeList extends SolidType {
	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new SolidTypeList object.
	 * @param types a union of types in this list type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		readonly types: SolidType,
		is_mutable: boolean = false,
	) {
		super(is_mutable, SolidList.values);
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.types.hasMutable;
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }List.<${ this.types }>`;
	}

	override includes(v: SolidObject): boolean {
		return (
			   v instanceof SolidList  && v.toType().isSubtypeOf(this)
			|| v instanceof SolidTuple && v.toType().isSubtypeOf(this)
		);
	}

	override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeList
			&& ((t.isMutable)
				? this.isMutable && this.types.equals(t.types)
				: this.types.isSubtypeOf(t.types)
			)
		);
	}

	override mutableOf(): SolidTypeList {
		return new SolidTypeList(this.types, true);
	}
}
