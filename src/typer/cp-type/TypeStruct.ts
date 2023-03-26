import {strictEqual} from '../../lib/index.js';
import type {TypeEntry} from '../utils-public.js';
import * as OBJ from '../cp-object/index.js';
import {OBJ as TYPE_OBJ} from './index.js';
import {Type} from './Type.js';
import {TypeUnit} from './TypeUnit.js';
import {TypeCollectionKeyedStatic} from './TypeCollectionKeyedStatic.js';
import {TypeRecord} from './TypeRecord.js';



export class TypeStruct extends TypeCollectionKeyedStatic {
	/**
	 * Is the argument a unit struct type?
	 * @return whether the argument is a `TypeUnit` and its value is a `Struct`
	 */
	public static isUnitType(type: Type): type is TypeUnit<OBJ.Struct> {
		return type instanceof TypeUnit && type.value instanceof OBJ.Struct;
	}

	/**
	 * Construct a new TypeStruct from type properties, assuming each property is required.
	 * @param propertytypes the types of the struct
	 * @return a new struct type with the provided properties
	 */
	public static fromTypes(propertytypes: ReadonlyMap<bigint, Type> = new Map()): TypeStruct {
		return new TypeStruct(new Map<bigint, TypeEntry>([...propertytypes].map(([id, t]) => [id, {
			type:     t,
			optional: false,
		}])));
	}


	public override readonly isReference: boolean = false;

	/**
	 * Construct a new TypeStruct object.
	 * @param invariants a map of this type’s property ids along with their associated types
	 */
	public constructor(invariants: ReadonlyMap<bigint, TypeEntry> = new Map()) {
		super(invariants, false, new Set([new OBJ.Struct()]));
	}

	public override get hasMutable(): boolean {
		return false;
	}

	public override toString(): string {
		return `\\[${ super.toString() }]`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Struct && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.equals(TYPE_OBJ) || (
			(t instanceof TypeStruct || t instanceof TypeRecord)
			&& this.count[0] >= t.count[0]
			&& !t.isMutable
			&& [...t.invariants].every(([id, thattype]) => {
				const thistype: TypeEntry | null = this.invariants.get(id) || null;
				return (
					(thattype.optional || thistype && !thistype.optional)
					&& (!thistype || (
						thistype.type.isSubtypeOf(thattype.type) // Covariance for structs: `A <: B --> Struct.<A> <: Struct.<B>`.
					))
				);
			})
		);
	}
}
