import {OBJ as VALUE} from './package.js';
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
	 * @param invariant a union of types in this dict type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariant: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new VALUE.Dict()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariant.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Dict.<${ this.invariant }>`;
	}

	public override includes(v: VALUE.Object): boolean {
		return v instanceof VALUE.Dict && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: Type): boolean {
		return t.equals(OBJ) || (
			t instanceof TypeDict
			&& ((t.isMutable)
				? this.isMutable && this.invariant.equals(t.invariant)
				: this.invariant.isSubtypeOf(t.invariant)
			)
		);
	}

	public override mutableOf(): TypeDict {
		return new TypeDict(this.invariant, true);
	}

	public override immutableOf(): TypeDict {
		return new TypeDict(this.invariant, false);
	}
}
