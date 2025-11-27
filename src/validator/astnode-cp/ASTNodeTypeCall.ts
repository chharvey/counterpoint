import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	type TYPE,
	TypeErrorNotNarrow,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../index.ts';
import {
	type NonemptyArray,
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {
	type ArgCount,
	type ValidFunctionName,
	check_valid_function_name,
	type ConstructorSchema,
	CLASS_API,
} from './utils-private.ts';
import type {ASTNodeCall} from './index.ts';
import {ASTNodeType} from './ASTNodeType.ts';
import {ASTNodeTypeAlias} from './ASTNodeTypeAlias.ts';



export class ASTNodeTypeCall extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeCall {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeCall);
		return typ;
	}

	/**
	 * Type-checks assignment of generic arguments to a type call or generic constructor call, and resolves unprovided generic arguments.
	 * @param constructor_schema the name of the class constructor’s schema
	 * @param args               the actual generic argument nodes provided
	 * @param call_node          the type/function call
	 * @return                   a list of resolved generic parameter assignments
	 */
	public static checkGenericArgs(constructor_schema: ConstructorSchema, args: readonly ASTNodeType[], call_node: ASTNodeTypeCall | ASTNodeCall): TYPE.Type[] {
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
		private readonly base: ASTNodeType,
		private readonly args: Readonly<NonemptyArray<ASTNodeType>>,
	) {
		super(start_node, {}, [base, ...args]);
	}

	public override varCheck(): void {
		// NOTE: ignore var-checking `this.base` for now, as semantics is determined by syntax.
		// (`this.base.source` must be a `ValidFunctionName`)
		check_valid_function_name(this.base.source);
		return xjs.Array.forEachAggregated(this.args, (arg) => arg.varCheck());
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		if (!(this.base instanceof ASTNodeTypeAlias)) {
			throw new TypeErrorNotCallable(this.base.eval(), this.base);
		}
		const constructor_schema: ConstructorSchema = CLASS_API.get(this.base.source as ValidFunctionName)!;
		return constructor_schema.returnType(ASTNodeTypeCall.checkGenericArgs(constructor_schema, this.args, this));
	}

	/**
	 * Count this call’s number of actual arguments and compare it to the number of expected arguments,
	 * and throw if the number is incorrect.
	 * The given argument may be a single value or a 2-tuple of values representing a range.
	 * If a 2-tuple, the first item represents the minimum (inclusive),
	 * and the second item represents the maximum (exclusive).
	 * E.g., `countArgs([2n, 5n])` expects 2, 3, or 4 arguments, but not 5.
	 * @param expected - the number of expected arguments, or a half-open range
	 * @throws if this call’s number of actual arguments does not satisfy the expected number
	 */
	private countArgs(expected: ArgCount): void {
		const actual: bigint = BigInt(this.args.length);
		if (typeof expected === 'bigint') {
			expected = [expected, expected + 1n];
		}
		if (actual < expected[0]) {
			throw new TypeErrorArgCount(actual, expected[0], true, this);
		}
		if (expected[1] <= actual) {
			throw new TypeErrorArgCount(actual, expected[1] - 1n, true, this);
		}
	}
}
