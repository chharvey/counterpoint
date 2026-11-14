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
} from '../../../typer/index.ts';
import {
	type SymbolSchema,
	SymbolSchemaType,
	SymbolSchemaClass,
} from '../../index.ts';
import {Operator} from '../../Operator.ts';
import {
	type CallableInterfaceName,
	type ConstructorSchema,
	CLASS_API,
	get_entry_info,
} from '../utils-private.ts';
import * as AST_TYPE from '../type/index.ts';
import type * as EXPR from '../expression/index.ts';



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
			assert.ok(!symbol.classSignature.genericParams);
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
		const constructor_schema: ConstructorSchema = CLASS_API.get(typenode.base.source as CallableInterfaceName)!;
		return constructor_schema.returnType(this.checkGenericArgs(constructor_schema, typenode.args, typenode));
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
	 * Type-checks assignment of generic arguments to a type call or generic constructor call, and resolves unprovided generic arguments.
	 * @param constructor_schema the name of the class constructor’s schema
	 * @param args               the actual generic argument nodes provided
	 * @param call_node          the type/function call
	 * @return                   a list of resolved generic parameter assignments
	 */
	public checkGenericArgs(constructor_schema: ConstructorSchema, args: readonly AST_TYPE.Type[], call_node: AST_TYPE.Call | EXPR.Call): TYPE.Type[] {
		const {genericParams: generic_params}: ConstructorSchema = constructor_schema;

		/* Argument Counting. Throws if the number of given args does not match the number of expected parameters. */
		const expected_generic = {
			min: BigInt(generic_params?.positional?.filter((param) => !param.default).length ?? 0),
			max: BigInt(generic_params?.positional?.length ?? 0),
		} as const;
		const actual_generic: bigint = BigInt(args.length);
		// TODO: throw AggregateError if both
		if (actual_generic < expected_generic.min) {
			throw new TypeErrorArgCount(actual_generic, expected_generic.min, true, call_node);
		}
		if (actual_generic > expected_generic.max) {
			throw new TypeErrorArgCount(actual_generic, expected_generic.max, true, call_node);
		}

		/* Argument Typing. Handles optionality and default values. Also checks if each argument matches the constraints given. */
		const generic_args: TYPE.Type[] = args.map((t_arg) => this.visit(t_arg));
		generic_params?.positional?.forEach((param, i) => {
			if (!args.at(i)) {
				assert.ok(param.default); // we can assert this due to argument counting above
				generic_args[i] = param.default.call(null, generic_args);
			}
			if (param.constraint) {
				const arg:             TYPE.Type = generic_args.at(i)!;
				const constraint_type: TYPE.Type = param.constraint.type.call(null, generic_args);
				if (param.constraint.direction === 'narrows' && !arg.isSubtypeOf(constraint_type)) {
					throw new TypeErrorNotNarrow(arg, constraint_type, call_node.line_index, call_node.col_index);
				} else if (param.constraint.direction === 'widens' && !constraint_type.isSubtypeOf(arg)) {
					throw new TypeErrorNotNarrow(constraint_type, arg, call_node.line_index, call_node.col_index);
				}
			}
		});
		return [...generic_args];
	}
}
