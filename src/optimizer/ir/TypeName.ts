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
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Type {
	public static fromAstType(typ: TYPE.Type): TypeName {
		return (
			typ.isSubtypeOf(TYPE.NULL)  ? TypeName.NULL :
			typ.isSubtypeOf(TYPE.BOOL)  ? TypeName.BOOL :
			typ.isSubtypeOf(TYPE.SYM)   ? TypeName.SYM :
			typ.isSubtypeOf(TYPE.INT)   ? TypeName.INT :
			// typ.isSubtypeOf(TYPE.NAT)   ? TypeName.NAT :
			typ.isSubtypeOf(TYPE.FLOAT) ? TypeName.FLOAT :
			typ.isSubtypeOf(TYPE.STR)   ? TypeName.STR :

			typ instanceof TYPE.Tuple  ? TypeName.TUPLE :
			typ instanceof TYPE.Record ? TypeName.RECORD :
			typ instanceof TYPE.List   ? TypeName.LIST :
			typ instanceof TYPE.Dict   ? TypeName.DICT :
			typ instanceof TYPE.Set    ? TypeName.SET :
			typ instanceof TYPE.Map    ? TypeName.MAP :

			TypeName.ANY
		);
	}
}
