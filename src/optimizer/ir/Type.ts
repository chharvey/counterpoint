import {TYPE} from '../../typer/index.ts';



export enum TypeName {
	TRAP,
	NULL,
	BOOL,
	SYM,
	INT,
	NAT,
	FLOAT,
	STR,
	TUPLE,
	RECORD,
	LIST,
	DICT,
	SET,
	MAP,
	/** @deprecated temporarily representing a “top type” until we can define aggregate types */
	ANY,
}






/** Internal representation type of an IR Value. */
export class Type {
	public static readonly TRAP:  Type = new Type(TypeName.TRAP);
	public static readonly NULL:  Type = new Type(TypeName.NULL);
	public static readonly BOOL:  Type = new Type(TypeName.BOOL);
	public static readonly SYM:   Type = new Type(TypeName.SYM);
	public static readonly INT:   Type = new Type(TypeName.INT);
	public static readonly NAT:   Type = new Type(TypeName.NAT);
	public static readonly FLOAT: Type = new Type(TypeName.FLOAT);
	public static readonly STR:   Type = new Type(TypeName.STR);

	public static readonly TUPLE:  Type = new Type(TypeName.TUPLE);
	public static readonly RECORD: Type = new Type(TypeName.RECORD);
	public static readonly LIST:   Type = new Type(TypeName.LIST);
	public static readonly DICT:   Type = new Type(TypeName.DICT);
	public static readonly SET:    Type = new Type(TypeName.SET);
	public static readonly MAP:    Type = new Type(TypeName.MAP);

	/** @deprecated temporarily representing a “top type” until we can define aggregate types */
	public static readonly ANY: Type = new Type(TypeName.ANY);


	public static fromAstType(typ: TYPE.Type): Type {
		return (
			typ.isSubtypeOf(TYPE.NULL)  ? Type.NULL :
			typ.isSubtypeOf(TYPE.BOOL)  ? Type.BOOL :
			typ.isSubtypeOf(TYPE.SYM)   ? Type.SYM :
			typ.isSubtypeOf(TYPE.INT)   ? Type.INT :
			// typ.isSubtypeOf(TYPE.NAT)   ? Type.NAT :
			typ.isSubtypeOf(TYPE.FLOAT) ? Type.FLOAT :
			typ.isSubtypeOf(TYPE.STR)   ? Type.STR :

			typ instanceof TYPE.Tuple  ? Type.TUPLE :
			typ instanceof TYPE.Record ? Type.RECORD :
			typ instanceof TYPE.List   ? Type.LIST :
			typ instanceof TYPE.Dict   ? Type.DICT :
			typ instanceof TYPE.Set    ? Type.SET :
			typ instanceof TYPE.Map    ? Type.MAP :

			Type.ANY
		);
	}


	private constructor(private readonly name: TypeName) {}

	public toString(): string {
		return TypeName[this.name];
	}
}
