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
		switch (true) { // copied from `AST.DeclarationVariable::writable_inferred_type` v0.5+ and modified slightly
			case typ.isSubtypeOf(TYPE.NULL):  { return Type.NULL; }
			case typ.isSubtypeOf(TYPE.BOOL):  { return Type.BOOL; }
			case typ.isSubtypeOf(TYPE.SYM):   { return Type.SYM; }
			case typ.isSubtypeOf(TYPE.INT):   { return Type.INT; }
			// case typ.isSubtypeOf(TYPE.NAT):   { return Type.NAT; }
			case typ.isSubtypeOf(TYPE.FLOAT): { return Type.FLOAT; }
			case typ.isSubtypeOf(TYPE.STR):   { return Type.STR; }

			case typ instanceof TYPE.Tuple:  { return Type.TUPLE; }
			case typ instanceof TYPE.Record: { return Type.RECORD; }
			case typ instanceof TYPE.List:   { return Type.LIST; }
			case typ instanceof TYPE.Dict:   { return Type.DICT; }
			case typ instanceof TYPE.Set:    { return Type.SET; }
			case typ instanceof TYPE.Map:    { return Type.MAP; }
		}

		if (typ instanceof TYPE.Union || typ instanceof TYPE.Intersection) {
			switch (true) {
				case typ.operands.every((op) => op instanceof TYPE.Tuple):  { return Type.TUPLE; }
				case typ.operands.every((op) => op instanceof TYPE.Record): { return Type.RECORD; }
				case typ.operands.every((op) => op instanceof TYPE.List):   { return Type.LIST; }
				case typ.operands.every((op) => op instanceof TYPE.Dict):   { return Type.DICT; }
				case typ.operands.every((op) => op instanceof TYPE.Set):    { return Type.SET; }
				case typ.operands.every((op) => op instanceof TYPE.Map):    { return Type.MAP; }
			}
		}
		return Type.ANY;
	}


	private constructor(public readonly name: TypeName) {}

	public toString(): string {
		return TypeName[this.name];
	}
}
