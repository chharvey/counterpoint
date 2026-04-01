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



export function ast_type_name(typ: TYPE.Type): TypeName {
	switch (true) {
		case typ.isSubtypeOf(TYPE.NULL):  { return TypeName.NULL; }
		case typ.isSubtypeOf(TYPE.BOOL):  { return TypeName.BOOL; }
		case typ.isSubtypeOf(TYPE.SYM):   { return TypeName.SYM; }
		case typ.isSubtypeOf(TYPE.INT):   { return TypeName.INT; }
		case typ.isSubtypeOf(TYPE.NAT):   { return TypeName.NAT; }
		case typ.isSubtypeOf(TYPE.FLOAT): { return TypeName.FLOAT; }
		case typ.isSubtypeOf(TYPE.STR):   { return TypeName.STR; }

		case typ instanceof TYPE.Tuple:  { return TypeName.TUPLE; }
		case typ instanceof TYPE.Record: { return TypeName.RECORD; }
		case typ instanceof TYPE.List:   { return TypeName.LIST; }
		case typ instanceof TYPE.Dict:   { return TypeName.DICT; }
		case typ instanceof TYPE.Set:    { return TypeName.SET; }
		case typ instanceof TYPE.Map:    { return TypeName.MAP; }
	}

	if (typ instanceof TYPE.Union || typ instanceof TYPE.Intersection) {
		switch (true) {
			case typ.operands.every((op) => op instanceof TYPE.Tuple):  { return TypeName.TUPLE; }
			case typ.operands.every((op) => op instanceof TYPE.Record): { return TypeName.RECORD; }
			case typ.operands.every((op) => op instanceof TYPE.List):   { return TypeName.LIST; }
			case typ.operands.every((op) => op instanceof TYPE.Dict):   { return TypeName.DICT; }
			case typ.operands.every((op) => op instanceof TYPE.Set):    { return TypeName.SET; }
			case typ.operands.every((op) => op instanceof TYPE.Map):    { return TypeName.MAP; }
		}
	}
	return TypeName.ANY;
}



export function stringify_type_name(typename: TypeName): string | undefined {
	return new Map<TypeName, string>([
		[TypeName.TRAP,   'nothing'],
		[TypeName.NULL,   'null'],
		[TypeName.BOOL,   'bool'],
		[TypeName.SYM,    'sym'],
		[TypeName.INT,    'int'],
		[TypeName.NAT,    'nat'],
		[TypeName.FLOAT,  'float'],
		[TypeName.STR,    'str'],
		[TypeName.TUPLE,  'tuple'],
		[TypeName.RECORD, 'record'],
		[TypeName.LIST,   'List'],
		[TypeName.DICT,   'Dict'],
		[TypeName.SET,    'Set'],
		[TypeName.MAP,    'Map'],
		[TypeName.ANY,    'anything'],
	]).get(typename);
}
