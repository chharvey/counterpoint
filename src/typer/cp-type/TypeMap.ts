import {OBJ} from './package.js';
import {Type} from './Type.js';
import {TypeUnit} from './TypeUnit.js';



export class TypeMap extends Type {
	/**
	 * Is the argument a unit map type?
	 * @return whether the argument is a `TypeUnit` and its value is a `Map`
	 */
	public static isUnitType(type: Type): type is TypeUnit<OBJ.Map> {
		return type instanceof TypeUnit && type.value instanceof OBJ.Map;
	}


	public override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeMap object.
	 * @param antecedenttypes a union of antecedent types in this map type
	 * @param consequenttypes a union of consequent types in this map type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly antecedenttypes: Type,
		public readonly consequenttypes: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.Map()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.antecedenttypes.hasMutable || this.consequenttypes.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Map.<${ this.antecedenttypes }, ${ this.consequenttypes }>`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Map && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: Type): boolean {
		return t.equals(Type.OBJ) || (
			t instanceof TypeMap
			&& ((t.isMutable)
				? this.isMutable && this.antecedenttypes.equals(t.antecedenttypes) && this.consequenttypes.equals(t.consequenttypes)
				: this.antecedenttypes.isSubtypeOf(t.antecedenttypes) && this.consequenttypes.isSubtypeOf(t.consequenttypes)
			)
		);
	}

	public override mutableOf(): TypeMap {
		return new TypeMap(this.antecedenttypes, this.consequenttypes, true);
	}

	public override immutableOf(): TypeMap {
		return new TypeMap(this.antecedenttypes, this.consequenttypes, false);
	}
}
