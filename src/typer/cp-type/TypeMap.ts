import * as OBJ from '../cp-object/index.js';
import {OBJ as TYPE_OBJ} from './index.js';
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
	 * @param invariant_ant a union of antecedent types in this map type
	 * @param invariant_con a union of consequent types in this map type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariant_ant: Type,
		public readonly invariant_con: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.Map()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariant_ant.hasMutable || this.invariant_con.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Map.<${ this.invariant_ant }, ${ this.invariant_con }>`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Map && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: Type): boolean {
		return t.equals(TYPE_OBJ) || (
			t instanceof TypeMap
			&& ((t.isMutable)
				? this.isMutable && this.invariant_ant.equals(t.invariant_ant) && this.invariant_con.equals(t.invariant_con)
				: this.invariant_ant.isSubtypeOf(t.invariant_ant) && this.invariant_con.isSubtypeOf(t.invariant_con)
			)
		);
	}

	public override mutableOf(): TypeMap {
		return new TypeMap(this.invariant_ant, this.invariant_con, true);
	}

	public override immutableOf(): TypeMap {
		return new TypeMap(this.invariant_ant, this.invariant_con, false);
	}
}
