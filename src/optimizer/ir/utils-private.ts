import binaryen from 'binaryen';
import type {VirtualMachine} from '../../vm/index.ts';
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



/**
 * Return a block containing `(drop)` expressions for each of `args`, followed by a final expression.
 * If `final` is provided as an ExpressionRef, it is the final expression;
 * otherwise, a v128 containing a boolean encoding is the final expression.
 * @param vm
 * @param args  the args to drop first
 * @param final the final expression/statement
 */
export function drop_then(
	vm:    VirtualMachine,
	args:  readonly binaryen.ExpressionRef[],
	final: binaryen.ExpressionRef | boolean,
): binaryen.ExpressionRef {
	const last_item: binaryen.ExpressionRef = typeof final === 'number' ? final : final ? vm.Vect.TRUE : vm.Vect.FALSE;
	return vm.mod.block(null, [...args.map((arg) => vm.mod.drop(arg)), last_item], binaryen.getExpressionType(last_item));
}
