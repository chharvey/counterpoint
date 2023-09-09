import * as assert from 'assert';
import binaryen from 'binaryen';
import {BinEither} from '../../index.js';
import {
	SolidType,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	ValidOperatorBinary,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



/**
 * Known subclasses:
 * - ASNodeOperationBinaryArithmetic
 * - ASNodeOperationBinaryComparative
 * - ASNodeOperationBinaryEquality
 * - ASNodeOperationBinaryLogical
 */
export abstract class ASTNodeOperationBinary extends ASTNodeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinary);
		return expression;
	}

	/**
	 * Return an instruction performing an operation on arguments.
	 * @param mod    the binaryen module
	 * @param op     the operator
	 * @param args   the operands
	 * @param simple a lambda performing the operation after handling unions; takes `args` as an argument
	 * @return       an instruction that performs the operation at runtime
	 * @final
	 */
	protected static operate(
		mod:    binaryen.Module,
		op:     ValidOperatorBinary,
		args:   readonly [binaryen.ExpressionRef, binaryen.ExpressionRef],
		simple: (args: readonly [binaryen.ExpressionRef, binaryen.ExpressionRef]) => binaryen.ExpressionRef,
	): binaryen.ExpressionRef {
		const bintypes: readonly binaryen.Type[] = args.map((arg) => binaryen.getExpressionType(arg));
		const bintypes_expanded: readonly (readonly binaryen.Type[])[] = bintypes.map((bt) => binaryen.expandType(bt));
		if (bintypes_expanded[0].length > 1 && bintypes_expanded[1].length > 1) {
			// assert: `args[0]` is equivalent to a result of `new BinEither().make()`
			// assert: `args[1]` is equivalent to a result of `new BinEither().make()`
			bintypes.forEach((bt) => ASTNodeOperation.expectEitherTuple(bt));
			const arg0 = new BinEither(mod, args[0]);
			const arg1 = new BinEither(mod, args[1]);
			const bintype0: {readonly left: binaryen.Type, readonly right: binaryen.Type} = {left: binaryen.getExpressionType(arg0.left), right: binaryen.getExpressionType(arg0.right)};
			const bintype1: {readonly left: binaryen.Type, readonly right: binaryen.Type} = {left: binaryen.getExpressionType(arg1.left), right: binaryen.getExpressionType(arg1.right)};

			/* throw any early errors */
			[
				[bintype0.left, bintype0.right],
				[bintype1.left, bintype1.right],
			].forEach((bintype_n, i) => assert.deepStrictEqual(bintype_n, bintypes_expanded[i].slice(1)));

			const left_left:   binaryen.ExpressionRef = ASTNodeOperationBinary.operate(mod, op, [arg0.left,  arg1.left],  simple);
			const left_right:  binaryen.ExpressionRef = ASTNodeOperationBinary.operate(mod, op, [arg0.left,  arg1.right], simple);
			const right_left:  binaryen.ExpressionRef = ASTNodeOperationBinary.operate(mod, op, [arg0.right, arg1.left],  simple);
			const right_right: binaryen.ExpressionRef = ASTNodeOperationBinary.operate(mod, op, [arg0.right, arg1.right], simple);

			/** {left_left: 0, left_right: 1, right_left: 2, right_right: 3} */
			const key: binaryen.ExpressionRef = mod.i32.add(mod.i32.mul(mod.i32.const(2), arg0.side), arg1.side);
			const options                     = [left_left, left_right, right_left, right_right] as const;

			/* first figure out the int and float values */
			let index_both_ints: 0 | 1 | 2 | 3;
			let value_int:       binaryen.ExpressionRef;
			let value_float:     binaryen.ExpressionRef;
			if (bintype0.left === binaryen.i32) {
				assert.strictEqual(bintype0.right, binaryen.f64);
				if (bintype1.left === binaryen.i32) {
					assert.strictEqual(bintype1.right, binaryen.f64);
					// (int | float) + (int | float)
					[index_both_ints, [value_int, value_float]] = [0, [left_left, ASTNodeOperationBinary.floatSideValue(mod, options, key, left_left)]];
				} else {
					assert.deepStrictEqual(
						bintype1,
						{left: binaryen.f64, right: binaryen.i32},
					);
					// (int | float) + (float | int)
					[index_both_ints, [value_int, value_float]] = [1, [left_right, ASTNodeOperationBinary.floatSideValue(mod, options, key, left_right)]];
				}
			} else {
				assert.deepStrictEqual(
					bintype0,
					{left: binaryen.f64, right: binaryen.i32},
				);
				if (bintype1.left === binaryen.i32) {
					assert.strictEqual(bintype1.right, binaryen.f64);
					// (float | int) + (int | float)
					[index_both_ints, [value_int, value_float]] = [2, [right_left, ASTNodeOperationBinary.floatSideValue(mod, options, key, right_left)]];
				} else {
					assert.deepStrictEqual(
						bintype1,
						{left: binaryen.f64, right: binaryen.i32},
					);
					// (float | int) + (float | int)
					[index_both_ints, [value_int, value_float]] = [3, [right_right, ASTNodeOperationBinary.floatSideValue(mod, options, key, right_right)]];
				}
			}

			/* now set the correct sides */
			let index:  binaryen.ExpressionRef;
			let values: [binaryen.ExpressionRef, binaryen.ExpressionRef];
			if (bintype1.left === binaryen.i32) {
				// Number + (int | float)
				index = mod.i32.eqz(mod.i32.eq(key, mod.i32.const(index_both_ints)));
				values = [value_int, value_float];
			} else {
				// Number + (float | int)
				index = mod.i32.eq(key, mod.i32.const(index_both_ints));
				values = [value_float, value_int];
			}

			return new BinEither(mod, index, ...values).make();
		}
		if (bintypes_expanded[0].length > 1 || bintypes_expanded[1].length > 1) {
			let arg:   BinEither;
			let left:  binaryen.ExpressionRef;
			let right: binaryen.ExpressionRef;
			if (bintypes_expanded[0].length > 1) {
				// assert: `args[0]` is equivalent to a result of `new BinEither().make()`
				ASTNodeOperation.expectEitherTuple(bintypes[0]);
				arg   = new BinEither(mod, args[0]);
				left  = ASTNodeOperationBinary.operate(mod, op, [arg.left,  args[1]], simple);
				right = ASTNodeOperationBinary.operate(mod, op, [arg.right, args[1]], simple);
			} else {
				assert.ok(bintypes_expanded[1].length > 1);
				// assert: `args[1]` is equivalent to a result of `new BinEither().make()`
				ASTNodeOperation.expectEitherTuple(bintypes[1]);
				arg   = new BinEither(mod, args[1]);
				left  = ASTNodeOperationBinary.operate(mod, op, [args[0], arg.left],  simple);
				right = ASTNodeOperationBinary.operate(mod, op, [args[0], arg.right], simple);
			}
			return (binaryen.getExpressionType(left) === binaryen.getExpressionType(right))
				? mod.if       (     mod.i32.eqz(arg.side), left, right)
				: new BinEither(mod,             arg.side,  left, right).make();
		} else {
			return simple.call(null, args);
		}
	}

	private static floatSideValue(
		mod:      binaryen.Module,
		options:  readonly [binaryen.ExpressionRef, binaryen.ExpressionRef, binaryen.ExpressionRef, binaryen.ExpressionRef],
		key:      number,
		excluded: binaryen.ExpressionRef,
	): binaryen.ExpressionRef {
		type Expr3 = [binaryen.ExpressionRef, binaryen.ExpressionRef, binaryen.ExpressionRef];
		const filtered: Readonly<Expr3> = [
			...options.slice(0, options.indexOf(excluded)),
			...options.slice(options.indexOf(excluded) + 1),
		] as Expr3; // `Array#splice` is stupid
		return mod.if(
			mod.i32.eq(key, mod.i32.const(options.indexOf(filtered[0]))),
			filtered[0],
			mod.if(
				mod.i32.eq(key, mod.i32.const(options.indexOf(filtered[1]))),
				filtered[1],
				(mod.i32.eq(key, mod.i32.const(options.indexOf(filtered[2]))), filtered[2]),
			),
		);
	}


	constructor(
		start_node: ParseNode,
		readonly operator: ValidOperatorBinary,
		readonly operand0: ASTNodeExpression,
		readonly operand1: ASTNodeExpression,
	) {
		super(start_node, operator, [operand0, operand1]);
	}
	/**
	 * @final
	 */
	protected override type_do(): SolidType {
		return this.type_do_do(
			this.operand0.type(),
			this.operand1.type(),
			this.validator.config.compilerOptions.intCoercion,
		)
	}
	protected abstract type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType;
}
