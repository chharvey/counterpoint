import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	TypeErrorNotNarrow,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../../index.ts';
import {
	type NonemptyArray,
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {EXPR} from '../index.ts';
import {
	type CallableInterfaceName,
	validate_callable_interface_name,
	type ConstructorSchema,
	CLASS_API,
} from '../utils-private.ts';
import {Type} from './Type.ts';
import {TypeAlias} from './TypeAlias.ts';



export class Call extends Type {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Call {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, Call);
		return typ;
	}

	/**
	 * Type-checks assignment of generic arguments to a type call or generic constructor call, and resolves unprovided generic arguments.
	 * @param constructor_schema the name of the class constructor’s schema
	 * @param args               the actual generic argument nodes provided
	 * @param call_node          the type/function call
	 * @return                   a list of resolved generic parameter assignments
	 */
	public static checkGenericArgs(constructor_schema: ConstructorSchema, args: readonly Type[], call_node: Call | EXPR.Call): TYPE.Type[] {
		const {genericParams: generic_params}: ConstructorSchema = constructor_schema;

		/* Argument Counting. Throws if the number of given args does not match the number of expected parameters. */
		const expected_generic = {
			min: BigInt(generic_params.filter((param) => !param.default).length),
			max: BigInt(generic_params.length),
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
		const generic_args: TYPE.Type[] = args.map((t_arg) => t_arg.eval());
		generic_params.forEach((param, i) => {
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


	public constructor(
		start_node: SyntaxNodeType<'type_compound'>,
		private readonly base: Type,
		private readonly args: Readonly<NonemptyArray<Type>>,
	) {
		super(start_node, {}, [base, ...args]);
	}

	public override varCheck(): void {
		// NOTE: ignore var-checking `this.base` for now, as semantics is determined by syntax.
		// (`this.base.source` must be a `CallableInterfaceName`)
		validate_callable_interface_name(this.base.source);
		return xjs.Array.forEachAggregated(this.args, (arg) => arg.varCheck());
	}

	public override typeCheck(): void {
		// NOTE: ignore type-checking `this.base` for now, as semantics is determined by syntax.
		// (`this.base.source` must be a `CallableInterfaceName`)
		xjs.Array.forEachAggregated(this.args, (arg) => arg.typeCheck());
		this.eval(); // assert does not throw
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		if (!(this.base instanceof TypeAlias)) {
			throw new TypeErrorNotCallable(this.base.eval(), this.base);
		}
		const constructor_schema: ConstructorSchema = CLASS_API.get(this.base.source as CallableInterfaceName)!;
		return constructor_schema.returnType(Call.checkGenericArgs(constructor_schema, this.args, this));
	}
}
