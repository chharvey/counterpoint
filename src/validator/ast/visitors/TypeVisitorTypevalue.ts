import * as assert from 'node:assert';
import {
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../../index.ts';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	type EntryType,
	TYPE,
	type GenericArgs,
	type GenericFuncParams,
} from '../../../typer/index.ts';
import {
	Validator,
	type SymbolSchema,
	SymbolSchemaType,
	SymbolSchemaClass,
} from '../../index.ts';
import {Operator} from '../../Operator.ts';
import {get_entry_info} from '../utils-private.ts';
import * as AST_TYPE from '../type/index.ts';
import * as EXPR from '../expression/index.ts';



function memoizeTypeTypevalue<Param extends AST_TYPE.Type>(
	method:   (this: TypeVisitorTypevalue, arg: Param) => TYPE.Type,
	_context: ClassMethodDecoratorContext<TypeVisitorTypevalue, typeof method>,
): typeof method {
	return function (arg) {
		arg.typevalue = method.bind(this, arg);
		return arg.typevalue;
	};
}



export class TypeVisitorTypevalue extends AST_TYPE.TypeVisitor<TYPE.Type> {
	@memoizeTypeTypevalue
	public override visitConstant(typenode: AST_TYPE.Constant): TYPE.Type {
		return typenode.typerTypevalue;
	}

	@memoizeTypeTypevalue
	public override visitTypeAlias(typenode: AST_TYPE.TypeAlias): TYPE.Type {
		assert.ok(typenode.validator.hasSymbol(typenode.id), `Expected ${typenode.source} (${typenode.id}) to be in the symbol table.`);
		const symbol: SymbolSchema = typenode.validator.getSymbol(typenode.id)!;
		if (symbol instanceof SymbolSchemaType) {
			return symbol.typevalue;
		} else {
			assert_instanceof(symbol, SymbolSchemaClass);
			return symbol.classSignature.instanceType;
		}
	}

	@memoizeTypeTypevalue
	public override visitTuple(typenode: AST_TYPE.Tuple): TYPE.Type {
		return new TYPE.Tuple(typenode.children.map((c) => ({
			type:     this.visit(c.typevalue),
			optional: c.optional,
		})));
	}

	@memoizeTypeTypevalue
	public override visitRecord(typenode: AST_TYPE.Record): TYPE.Type {
		return new TYPE.Record(new Map<bigint, EntryType>(typenode.children.map((c) => [
			c.key.id,
			{
				type:     this.visit(c.typevalue),
				optional: c.optional,
			},
		])));
	}

	@memoizeTypeTypevalue
	public override visitList(typenode: AST_TYPE.List): TYPE.Type {
		return new TYPE.List(this.visit(typenode.type));
	}

	@memoizeTypeTypevalue
	public override visitDict(typenode: AST_TYPE.Dict): TYPE.Type {
		return new TYPE.Dict(this.visit(typenode.type));
	}

	@memoizeTypeTypevalue
	public override visitSet(typenode: AST_TYPE.Set): TYPE.Type {
		return new TYPE.Set(this.visit(typenode.type));
	}

	@memoizeTypeTypevalue
	public override visitMap(typenode: AST_TYPE.Map): TYPE.Type {
		return new TYPE.Map(this.visit(typenode.antecedenttype), this.visit(typenode.consequenttype));
	}

	@memoizeTypeTypevalue
	public override visitAccess(typenode: AST_TYPE.Access): TYPE.Type {
		const entry: EntryType = get_entry_info(this.visit(typenode.base), typenode);
		return entry.optional ? new TYPE.Maybe(entry.type) : entry.type;
	}

	@memoizeTypeTypevalue
	public override visitCall(typenode: AST_TYPE.Call): TYPE.Type {
		if (!(typenode.base instanceof AST_TYPE.TypeAlias)) {
			throw new TypeErrorNotCallable(this.visit(typenode.base), typenode.base);
		}
		const symbol: SymbolSchema = typenode.validator.getSymbol(typenode.base.id)!;
		if (!(symbol instanceof SymbolSchemaClass)) {
			throw new TypeErrorNotCallable(this.visit(typenode.base), typenode.base);
		}
		return symbol.classSignature.returnType(this.checkGenericArgs(typenode, symbol.classSignature.genericParams));
	}

	@memoizeTypeTypevalue
	public override visitOperationUnary(typenode: AST_TYPE.OperationUnary): TYPE.Type {
		const t: TYPE.Type = this.visit(typenode.operand);
		return (
			typenode.operator === Operator.MAYBE   ? new TYPE.Maybe(t) :
			typenode.operator === Operator.RESULT  ? new TYPE.Result(t) :
			typenode.operator === Operator.MUTABLE ? t instanceof TYPE.ReferenceType ? t.mutableOf() : assert.fail(new TypeErrorInvalidOperation(typenode)) :
			assert.fail(`TypeOperationUnary#eval did not expect the operator \`${Operator[typenode.operator]}\`.`)
		);
	}

	@memoizeTypeTypevalue
	public override visitOperationBinary(typenode: AST_TYPE.OperationBinary): TYPE.Type {
		const [t0, t1]: readonly TYPE.Type[] = typenode.children.map((operand) => this.visit(operand));
		return (
			typenode.operator === Operator.AND ? t0.intersect(t1) :
			typenode.operator === Operator.OR  ? t0.union    (t1) :
			assert.fail(`Did not expect the operator \`${Operator[typenode.operator]}\`.`)
		);
	}

	@memoizeTypeTypevalue
	public override visitFunction(typenode: AST_TYPE.Function): TYPE.Type {
		return new TYPE.Function(
			new TYPE.Tuple(typenode.paramPositTypes.map((c) => ({
				type:     this.visit(c.typevalue),
				optional: c.optional,
			}))),
			new TYPE.Record(new Map<bigint, EntryType>(typenode.paramNamedTypes.map((c) => [
				c.key.id,
				{
					type:     this.visit(c.typevalue),
					optional: c.optional,
				},
			]))),
			typenode.returnType ? this.visit(typenode.returnType) : undefined,
		);
	}

	public override defaultVisit(_typenode: AST_TYPE.Type): TYPE.Type {
		return TYPE.ANYTHING;
	}

	/**
	 * Type-checks assignment of generic argument nodes to a type call or generic constructor call, and resolves unprovided generic arguments.
	 * @param call           the type/function call node
	 * @param generic_params the generic parameter signature of the class, interface, or type function
	 * @return               resolved generic parameter assignments
	 */
	public checkGenericArgs(call: AST_TYPE.Call | EXPR.Call, generic_params?: GenericFuncParams): GenericArgs {
		const args_posit: readonly AST_TYPE.Type[]           = call instanceof AST_TYPE.Call ? call.argsPosit : call.typeargsPosit;
		const args_named: ReadonlyMap<bigint, AST_TYPE.Type> = new Map((call instanceof AST_TYPE.Call
			? call.argsNamed
			: call.typeargsNamed
		).map((arg) => [arg.key.id, arg.typevalue]));

		/* Argument Counting. Throws if the number of given args does not match the number of expected parameters. */
		const expected_posit = {min: BigInt(generic_params?.positional?.filter((param) => !param.default).length ?? 0),             max: BigInt(generic_params?.positional?.length ?? 0)} as const;
		const expected_named = {min: BigInt([...(generic_params?.named?.values().filter((param) => !param.default) ?? [])].length), max: BigInt(generic_params?.named?.size        ?? 0)} as const;
		const actual_posit: bigint = BigInt(args_posit.length);
		const actual_named: bigint = BigInt(args_named.size);

		if (actual_posit < expected_posit.min) {
			throw new TypeErrorArgCount(actual_posit, expected_posit.min, {generic: true, named: false}, call);
		} else if (actual_posit > expected_posit.max) {
			throw new TypeErrorArgCount(actual_posit, expected_posit.max, {generic: true, named: false}, call);
		}
		if (actual_named < expected_named.min) {
			throw new TypeErrorArgCount(actual_named, expected_named.min, {generic: true, named: true}, call);
		} else if (actual_named > expected_named.max) {
			throw new TypeErrorArgCount(actual_named, expected_named.max, {generic: true, named: true}, call);
		}

		if (call instanceof EXPR.Call) {
			if (!expected_posit.max && !expected_named.max && call.generic) {
				/*
				 * Throw when a non-generic function is called with a generic argument list.
				 * ```cpl
				 * claim sum(a: int, b: int): int;
				 * sum[](2, 3); % TypeError
				 * sum(2, 3);   % fixed
				 * ```
				 * This must be treated separately from argument counting above,
				 * because `sum[](2, 3)` (given no args, expecting no args) would pass.
				 *
				 * This check only applies to call expressions, because type calls always require a generic argument list (even if empty).
				 * ```cpl
				 * typefunc Id[T? = int] => T;
				 * type U = Id[]; % allowed
				 * type V = Id;   % ReferenceError
				 * ```
				 */
				throw new TypeError('A non-generic function was called with a generic argument list.'); // TODO: create a new CplTypeError class
			} else if ((expected_posit.max || expected_named.max) && !call.generic) {
				/*
				 * Conversely, throw when a generic function is called without a generic argument list.
				 * ```cpl
				 * claim sum[T? = int](a: T, b: T): T;
				 * sum(2, 3);   % TypeError
				 * sum[](2, 3); % fixed
				 * ```
				 * This must be treated separately from argument counting above,
				 * because `sum(2, 3)` (given no args, expecting 0–1 args) would pass.
				 */
				throw new TypeError('A generic function was called without a generic argument list.'); // TODO: create a new CplTypeError class
			}
		}

		/* Argument Typing. Handles optionality and default values. Also checks if each argument matches the constraints given. */
		const resolved_positional: TYPE.Type[] = args_posit.map((argnode) => this.visit(argnode));
		const resolved_named = new Map<bigint, TYPE.Type>([...args_named].map(([argnode_id, argnode_type]) => [argnode_id, this.visit(argnode_type)]));
		const resolved_args: GenericArgs = {
			positional: resolved_positional,
			named:      resolved_named,
		};
		generic_params?.positional?.forEach((param, i) => {
			const argnode: AST_TYPE.Type | undefined = args_posit.at(i);
			if (!argnode) {
				assert.ok(param.default); // we can assert param is optional due to argument counting above
				resolved_positional[i] = param.default.call(null, resolved_args);
			}
			if (param.constraint) {
				const arg:             TYPE.Type = resolved_positional.at(i)!;
				const constraint_type: TYPE.Type = param.constraint[1].call(null, resolved_args);
				if (param.constraint[0] === 'narrows' && !arg.isSubtypeOf(constraint_type)) {
					throw new TypeErrorNotNarrow(arg, constraint_type, call.line_index, call.col_index);
				} else if (param.constraint[0] === 'widens' && !constraint_type.isSubtypeOf(arg)) {
					throw new TypeErrorNotNarrow(constraint_type, arg, call.line_index, call.col_index);
				}
			}
		});
		generic_params?.named?.forEach((param, id) => {
			const argnode: [bigint, AST_TYPE.Type] | undefined = [...args_named].find(([argnode_id]) => argnode_id === id);
			if (!argnode) {
				// we cannot assert param is optional because argument counting above only applies to positional parameters
				if (!param.default) {
					throw new TypeError(`Missing argument for required named parameter \`${Validator.unhashIdentifierId(id)}\`.`); // TODO: new class of CplTypeError
				}
				resolved_named.set(id, param.default.call(null, resolved_args));
			}
			if (param.constraint) {
				const arg:             TYPE.Type = resolved_named.get(id)!;
				const constraint_type: TYPE.Type = param.constraint[1].call(null, resolved_args);
				if (param.constraint[0] === 'narrows' && !arg.isSubtypeOf(constraint_type)) {
					throw new TypeErrorNotNarrow(arg, constraint_type, call.line_index, call.col_index);
				} else if (param.constraint[0] === 'widens' && !constraint_type.isSubtypeOf(arg)) {
					throw new TypeErrorNotNarrow(constraint_type, arg, call.line_index, call.col_index);
				}
			}
		});
		return resolved_args;
	}
}
