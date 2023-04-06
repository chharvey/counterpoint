import * as assert from 'assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs'
import {BinEither} from '../../index.js';
import {
	SolidType,
	SolidTypeUnion,
	SolidObject,
	SolidNumber,
	Int16,
	Builder,
	TypeError01,
	NanError01,
	NanError02,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	Operator,
	ValidOperatorArithmetic,
} from './package.js';
import {
	bothNumeric,
	eitherFloats,
	bothInts,
	bothFloats,
} from './utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';



export class ASTNodeOperationBinaryArithmetic extends ASTNodeOperationBinary {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryArithmetic {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryArithmetic);
		return expression;
	}

	/**
	 * Return an instruction performing an operation on arguments.
	 * @param mod   the binaryen module
	 * @param op    the binary operator
	 * @param types the compile-time types of the operands
	 * @param args  the operands
	 * @return      an instruction that performs the operation at runtime
	 */
	private static operate(
		mod:   binaryen.Module,
		op:    ValidOperatorArithmetic,
		types: readonly [SolidType, SolidType],
		args:  readonly [binaryen.ExpressionRef, binaryen.ExpressionRef],
	): binaryen.ExpressionRef {
		if (types[0] instanceof SolidTypeUnion && types[1] instanceof SolidTypeUnion) {
			// assert: `args[0]` is equivalent to a result of `new BinEither().make()`
			// assert: `args[1]` is equivalent to a result of `new BinEither().make()`

			const arg0:     {readonly left: binaryen.ExpressionRef, readonly right: binaryen.ExpressionRef} = {left: BinEither.leftOf(mod, args[0]),        right: BinEither.rightOf(mod, args[0])};
			const arg1:     {readonly left: binaryen.ExpressionRef, readonly right: binaryen.ExpressionRef} = {left: BinEither.leftOf(mod, args[1]),        right: BinEither.rightOf(mod, args[1])};
			const bintype0: {readonly left: binaryen.Type,          readonly right: binaryen.Type}          = {left: binaryen.getExpressionType(arg0.left), right: binaryen.getExpressionType(arg0.right)};
			const bintype1: {readonly left: binaryen.Type,          readonly right: binaryen.Type}          = {left: binaryen.getExpressionType(arg1.left), right: binaryen.getExpressionType(arg1.right)};

			/* throw any early errors */
			[
				bintype0.left,
				bintype0.right,
				bintype1.left,
				bintype1.right,
			].forEach((bt) => ASTNodeOperation.expectIntOrFloat(bt));

			const left_left:   binaryen.ExpressionRef = ASTNodeOperationBinaryArithmetic.operate(mod, op, [types[0].left,  types[1].left],  [arg0.left,  arg1.left]);
			const left_right:  binaryen.ExpressionRef = ASTNodeOperationBinaryArithmetic.operate(mod, op, [types[0].left,  types[1].right], [arg0.left,  arg1.right]);
			const right_left:  binaryen.ExpressionRef = ASTNodeOperationBinaryArithmetic.operate(mod, op, [types[0].right, types[1].left],  [arg0.right, arg1.left]);
			const right_right: binaryen.ExpressionRef = ASTNodeOperationBinaryArithmetic.operate(mod, op, [types[0].right, types[1].right], [arg0.right, arg1.right]);

			/** {left_left: 0, left_right: 1, right_left: 2, right_right: 3} */
			const flattened_key = mod.i32.add(
				mod.i32.mul(mod.i32.const(2), BinEither.sideOf(mod, args[0])),
				BinEither.sideOf(mod, args[1]),
			);

			function float_side_value(excluded: binaryen.ExpressionRef): binaryen.ExpressionRef {
				type Expr3 = [binaryen.ExpressionRef, binaryen.ExpressionRef, binaryen.ExpressionRef];
				const map = [
					left_left,
					left_right,
					right_left,
					right_right,
				] as const;
				const options: Readonly<Expr3> = [
					...map.slice(0, map.indexOf(excluded)),
					...map.slice(map.indexOf(excluded) + 1),
				] as Expr3; // `Array#splice` is stupid
				return mod.if(
					mod.i32.eq(flattened_key, mod.i32.const(map.indexOf(options[0]))),
					options[0],
					mod.if(
						mod.i32.eq(flattened_key, mod.i32.const(map.indexOf(options[1]))),
						options[1],
						(mod.i32.eq(flattened_key, mod.i32.const(map.indexOf(options[2]))), options[2]),
					),
				);
			}

			/* first figure out the int and float values */
			let index_both_ints: 0 | 1 | 2 | 3;
			let value_int:       binaryen.ExpressionRef;
			let value_float:     binaryen.ExpressionRef;
			if (bintype0.left === binaryen.i32) {
				assert.strictEqual(bintype0.right, binaryen.f64, `Expected ${ types[0].right } to be \`float\`.`);
				if (bintype1.left === binaryen.i32) {
					assert.strictEqual(bintype1.right, binaryen.f64, `Expected ${ types[1].right } to be \`float\`.`);
					// (int | float) + (int | float)
					[index_both_ints, [value_int, value_float]] = [0, [left_left, float_side_value(left_left)]];
				} else {
					assert.deepStrictEqual(
						bintype1,
						{left: binaryen.f64, right: binaryen.i32},
						`Expected ${ types[1] } to be \`float | int\`.`,
					);
					// (int | float) + (float | int)
					[index_both_ints, [value_int, value_float]] = [1, [left_right, float_side_value(left_right)]];
				}
			} else {
				assert.deepStrictEqual(
					bintype0,
					{left: binaryen.f64, right: binaryen.i32},
					`Expected ${ types[1] } to be \`float | int\`.`,
				);
				if (bintype1.left === binaryen.i32) {
					assert.strictEqual(bintype1.right, binaryen.f64, `Expected ${ types[1].right } to be \`float\`.`);
					// (float | int) + (int | float)
					[index_both_ints, [value_int, value_float]] = [2, [right_left, float_side_value(right_left)]];
				} else {
					assert.deepStrictEqual(
						bintype1,
						{left: binaryen.f64, right: binaryen.i32},
						`Expected ${ types[1] } to be \`float | int\`.`,
					);
					// (float | int) + (float | int)
					[index_both_ints, [value_int, value_float]] = [3, [right_right, float_side_value(right_right)]];
				}
			}

			/* now set the correct sides */
			let index:  binaryen.ExpressionRef;
			let values: [binaryen.ExpressionRef, binaryen.ExpressionRef];
			if (bintype1.left === binaryen.i32) {
				// Number + (int | float)
				index = mod.i32.eqz(mod.i32.eq(flattened_key, mod.i32.const(index_both_ints)));
				values = [value_int, value_float];
			} else {
				// Number + (float | int)
				index = mod.i32.eq(flattened_key, mod.i32.const(index_both_ints));
				values = [value_float, value_int];
			}

			return new BinEither(mod, index, ...values).make();
		}
		if (types[0] instanceof SolidTypeUnion) {
			// assert: `args[0]` is equivalent to a result of `new BinEither().make()`
			return new BinEither(
				mod,
				BinEither.sideOf(mod, args[0]),
				ASTNodeOperationBinaryArithmetic.operate(mod, op, [types[0].left,  types[1]], [BinEither.leftOf  (mod, args[0]), args[1]]),
				ASTNodeOperationBinaryArithmetic.operate(mod, op, [types[0].right, types[1]], [BinEither.rightOf (mod, args[0]), args[1]]),
			).make();
		} else if (types[1] instanceof SolidTypeUnion) {
			// assert: `args[1]` is equivalent to a result of `new BinEither().make()`
			return new BinEither(
				mod,
				BinEither.sideOf(mod, args[1]),
				ASTNodeOperationBinaryArithmetic.operate(mod, op, [types[0], types[1].left],  [args[0], BinEither.leftOf (mod, args[1])]),
				ASTNodeOperationBinaryArithmetic.operate(mod, op, [types[0], types[1].right], [args[0], BinEither.rightOf(mod, args[1])]),
			).make();
		} else {
			args = ASTNodeOperation.coerceOperands(mod, ...args);
			const bintypes: readonly [binaryen.Type, binaryen.Type] = [
				binaryen.getExpressionType(args[0]),
				binaryen.getExpressionType(args[1]),
			];
			bintypes.forEach((bt) => ASTNodeOperation.expectIntOrFloat(bt));
			const bintype: binaryen.Type = (bintypes.includes(binaryen.f64)) ? binaryen.f64 : binaryen.i32;
			return (
				(op === Operator.EXP) ? new Map<binaryen.Type, binaryen.ExpressionRef>([
					[binaryen.i32, mod.call('exp', [...args], binaryen.i32)],
					[binaryen.f64, mod.unreachable()], // TODO: support runtime exponentiation for floats
				]).get(bintype)! :
				(op === Operator.DIV) ? new Map<binaryen.Type, binaryen.ExpressionRef>([
					[binaryen.i32, mod.i32.div_s (...args)],
					[binaryen.f64, mod.f64.div   (...args)],
				]).get(bintype)! :
				mod[new Map<binaryen.Type, 'i32' | 'f64'>([
					[binaryen.i32, 'i32'],
					[binaryen.f64, 'f64'],
				]).get(bintype)!][new Map<Operator, 'mul' | 'add' | 'sub'>([
					[Operator.MUL, 'mul'],
					[Operator.ADD, 'add'],
					[Operator.SUB, 'sub'],
				]).get(op)!](...args)
			);
		}
	}


	constructor (
		start_node: ParseNode,
		override readonly operator: ValidOperatorArithmetic,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	protected override build_do(builder: Builder): binaryen.ExpressionRef {
		return ASTNodeOperationBinaryArithmetic.operate(
			builder.module,
			this.operator,
			[this.operand0.type(),         this.operand1.type()],
			[this.operand0.build(builder), this.operand1.build(builder)],
		);
	}

	protected override type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType {
		if (bothNumeric(t0, t1)) {
			if (bothInts(t0, t1)) {
				return SolidType.INT;
			}
			if (bothFloats(t0, t1)) {
				return SolidType.FLOAT;
			}
			if (int_coercion) {
				return (eitherFloats(t0, t1)) ? SolidType.FLOAT : t0.union(t1);
			}
		}
		throw new TypeError01(this)
	}

	protected override fold_do(): SolidObject | null {
		const v0: SolidObject | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		const v1: SolidObject | null = this.operand1.fold();
		if (!v1) {
			return v1;
		}
		if (this.operator === Operator.DIV && v1 instanceof SolidNumber && v1.eq0()) {
			throw new NanError02(this.operand1);
		}
		return (v0 instanceof Int16 && v1 instanceof Int16)
			? this.foldNumeric(v0, v1)
			: this.foldNumeric(
				(v0 as SolidNumber).toFloat(),
				(v1 as SolidNumber).toFloat(),
			);
	}
	private foldNumeric<T extends SolidNumber<T>>(x: T, y: T): T {
		try {
			return new Map<Operator, (x: T, y: T) => T>([
				[Operator.EXP, (x, y) => x.exp(y)],
				[Operator.MUL, (x, y) => x.times(y)],
				[Operator.DIV, (x, y) => x.divide(y)],
				[Operator.ADD, (x, y) => x.plus(y)],
				// [Operator.SUB, (x, y) => x.minus(y)],
			]).get(this.operator)!(x, y)
		} catch (err) {
			throw (err instanceof xjs.NaNError) ? new NanError01(this) : err;
		}
	}
}
