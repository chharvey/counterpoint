import {
	strictEqual,
	OBJ,
} from './package.js';
import {Type} from './Type.js';



export class TypeSet extends Type {
	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeSet object.
	 * @param types a union of types in this set type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		readonly types: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.Set()]));
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.types.hasMutable;
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Set.<${ this.types }>`;
	}

	override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Set && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.subtypeDeco
	override isSubtypeOf(t: Type): boolean {
		return t.equals(Type.OBJ) || (
			t instanceof TypeSet
			&& ((t.isMutable)
				? this.isMutable && this.types.equals(t.types)
				: this.types.isSubtypeOf(t.types)
			)
		);
	}

	override mutableOf(): TypeSet {
		return new TypeSet(this.types, true);
	}

	override immutableOf(): TypeSet {
		return new TypeSet(this.types, false);
	}
}
