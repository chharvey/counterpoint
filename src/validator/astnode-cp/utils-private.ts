import {
	VALUE,
	TYPE,
	TypeErrorInvalidOperation,
} from '../../index.ts';
import type {CPConfig} from '../../core/index.ts';
import {
	Operator,
	type ValidTypeAccessOperator,
	type ValidAccessOperator,
	Validator,
	type AST,
} from '../index.ts';



export type ArgCount = bigint | readonly [bigint, bigint];



export enum ValidIntrinsicName {
	OBJECT = 'Object',
}

export enum ValidFunctionName {
	LIST = 'List',
	DICT = 'Dict',
	SET  = 'Set',
	MAP  = 'Map',
}

export function is_valid_intrinsic_name(source: string): source is ValidIntrinsicName {
	return Object.values<string>(ValidIntrinsicName).includes(source);
}

export function invalid_function_name(source: string): never {
	throw new SyntaxError(`Unexpected token: ${ source }; expected \`${ Object.values(ValidFunctionName).join(' | ') }\`.`);
}



export function bothNumeric(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function bothNumeric(v0: VALUE.Value, v1: VALUE.Value): boolean;
export function bothNumeric(arg0: TYPE.Type | VALUE.Value, arg1: TYPE.Type | VALUE.Value): boolean {
	const int_float: TYPE.Type = TYPE.INT.union(TYPE.FLOAT);
	return (arg0 instanceof TYPE.Type && arg1 instanceof TYPE.Type)
		? [arg0, arg1].every((t) => t.isSubtypeOf(int_float))
		: [arg0, arg1].every((o) => o instanceof VALUE.Number);
}

export function bothInts(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function bothInts(v0: VALUE.Value, v1: VALUE.Value): boolean;
export function bothInts(arg0: TYPE.Type | VALUE.Value, arg1: TYPE.Type | VALUE.Value): boolean {
	return (arg0 instanceof TYPE.Type && arg1 instanceof TYPE.Type)
		? [arg0, arg1].every((t) => t.isSubtypeOf(TYPE.INT))
		: [arg0, arg1].every((o) => o instanceof VALUE.Integer);
}

export function bothFloats(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function bothFloats(v0: VALUE.Value, v1: VALUE.Value): boolean;
export function bothFloats(arg0: TYPE.Type | VALUE.Value, arg1: TYPE.Type | VALUE.Value): boolean {
	return (arg0 instanceof TYPE.Type && arg1 instanceof TYPE.Type)
		? [arg0, arg1].every((t) => t.isSubtypeOf(TYPE.FLOAT))
		: [arg0, arg1].every((o) => o instanceof VALUE.Float);
}

export function eitherFloats(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function eitherFloats(v0: VALUE.Value, v1: VALUE.Value): boolean;
export function eitherFloats(arg0: TYPE.Type | VALUE.Value, arg1: TYPE.Type | VALUE.Value): boolean {
	return (arg0 instanceof TYPE.Type && arg1 instanceof TYPE.Type)
		? [arg0, arg1].some((t) => t.isSubtypeOf(TYPE.FLOAT))
		: [arg0, arg1].some((o) => o instanceof VALUE.Float);
}

export function neitherFloats(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function neitherFloats(v0: VALUE.Value, v1: VALUE.Value): boolean;
export function neitherFloats(arg0: TYPE.Type | VALUE.Value, arg1: TYPE.Type | VALUE.Value): boolean {
	// @ts-expect-error --- both args are either both `TYPE.Type`s or both `VALUE.Value`s
	return !eitherFloats(arg0, arg1);
}

export function oneFloats(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function oneFloats(v0: VALUE.Value, v1: VALUE.Value): boolean;
export function oneFloats(arg0: TYPE.Type | VALUE.Value, arg1: TYPE.Type | VALUE.Value): boolean {
	// @ts-expect-error --- both args are either both `TYPE.Type`s or both `VALUE.Value`s
	return eitherFloats(arg0, arg1) && !bothFloats(arg0, arg1);
}



export function valueOfTokenNumber(source: string, config: CPConfig): VALUE.Integer | VALUE.Float {
	const cooked: bigint | number = Validator.cookTokenNumber(source, config);
	return (typeof cooked === 'bigint') ? new VALUE.Integer(cooked) : new VALUE.Float(cooked);
}



export function validate_static_access_kind(access_kind: ValidTypeAccessOperator | ValidAccessOperator, is_entry_optional: boolean, access: AST.ASTNodeTypeAccess | AST.ASTNodeAccess): void {
	if (
		access_kind === Operator.DOT    && is_entry_optional ||
		access_kind === Operator.OPTDOT && !is_entry_optional
	) {
		throw new TypeErrorInvalidOperation(access);
	}
}



export function update_accessed_type(type: TYPE.Type, access_kind: ValidTypeAccessOperator | ValidAccessOperator): TYPE.Type {
	switch (access_kind) {
		case Operator.DOT: {
			return type;
		}
		case Operator.OPTDOT: {
			return type.union(TYPE.NULL);
		}
		case Operator.CLAIMDOT: {
			return type.subtract(TYPE.VOID);
		}
	}
}
