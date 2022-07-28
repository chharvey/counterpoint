import {
	strictEqual,
	OBJ,
} from './package.js';
import {Type} from './Type.js';



export class TypeList extends Type {
	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeList object.
	 * @param types a union of types in this list type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		readonly types: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.List()]));
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.types.hasMutable;
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }List.<${ this.types }>`;
	}

	override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.List && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.subtypeDeco
	override isSubtypeOf(t: Type): boolean {
		return t.equals(Type.OBJ) || (
			t instanceof TypeList
			&& ((t.isMutable)
				? this.isMutable && this.types.equals(t.types)
				: this.types.isSubtypeOf(t.types)
			)
		);
	}

	override mutableOf(): TypeList {
		return new TypeList(this.types, true);
	}

	override immutableOf(): TypeList {
		return new TypeList(this.types, false);
	}
}
