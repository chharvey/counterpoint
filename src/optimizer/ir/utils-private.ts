import {TypeName} from './utils-public.ts';



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
