import {
	strictEqual,
	OBJ as VALUE,
} from './package.js';
import {Type} from './Type.js';
import {TypeUnit} from './TypeUnit.js';
import {OBJ} from './index.js';



export class TypeDict extends Type {
	/**
	 * Is the argument a unit dict type?
	 * @return whether the argument is a `TypeUnit` and its value is a `Dict`
	 */
	public static isUnitType(type: Type): type is TypeUnit<VALUE.Dict> {
		return type instanceof TypeUnit && type.value instanceof VALUE.Dict;
	}


	public override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeDict object.
	 * @param types a union of types in this dict type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly types: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new VALUE.Dict()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.types.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Dict.<${ this.types }>`;
	}

	public override includes(v: VALUE.Object): boolean {
		return v instanceof VALUE.Dict && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.equals(OBJ) || (
			t instanceof TypeDict
			&& ((t.isMutable)
				? this.isMutable && this.types.equals(t.types)
				: this.types.isSubtypeOf(t.types)
			)
		);
	}

	public override mutableOf(): TypeDict {
		return new TypeDict(this.types, true);
	}

	public override immutableOf(): TypeDict {
		return new TypeDict(this.types, false);
	}
}
