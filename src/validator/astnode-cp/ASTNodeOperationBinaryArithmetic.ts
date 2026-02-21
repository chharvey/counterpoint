import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	type Optimizer,
	IR,
	TypeErrorInvalidOperation,
	NanErrorInvalid,
	NanErrorDivZero,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeSupertype} from '../utils-private.ts';
import {
	Operator,
	type ValidOperatorArithmetic,
} from '../Operator.ts';
import {
	bothNumeric,
	eitherFloats,
	bothInts,
	bothFloats,
} from './utils-private.ts';
import {
	lowerDeco,
	buildDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.ts';



export class ASTNodeOperationBinaryArithmetic extends ASTNodeOperationBinary {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryArithmetic {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationBinaryArithmetic);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorArithmetic,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	@memoizeMethod
	@lowerDeco
	public override lower(optimizer: Optimizer): IR.Instruction {
		const [t0, t1] = [this.operand0.type(),           this.operand1.type()];
		const [l0, l1] = [this.operand0.lower(optimizer), this.operand1.lower(optimizer)];
		const operation: IR.Instruction = (
			bothInts(t0, t1) ? new IR.Binop(new Map<Operator, IR.BinOp>([
				[Operator.EXP, IR.BinOp.INT_EXP],
				[Operator.MUL, IR.BinOp.INT_MUL],
				[Operator.DIV, IR.BinOp.INT_DIV],
				[Operator.ADD, IR.BinOp.INT_ADD],
				[Operator.SUB, IR.BinOp.INT_SUB],
			]).get(this.operator)!, l0, l1) :
			bothFloats(t0, t1) ? new IR.Binop(new Map<Operator, IR.BinOp>([
				[Operator.EXP, IR.BinOp.FLOAT_EXP],
				[Operator.MUL, IR.BinOp.FLOAT_MUL],
				[Operator.DIV, IR.BinOp.FLOAT_DIV],
				[Operator.ADD, IR.BinOp.FLOAT_ADD],
				[Operator.SUB, IR.BinOp.FLOAT_SUB],
			]).get(this.operator)!, l0, l1) :
			new IR.Trap()
		);

		/*
		 * Three-Address Code. See <https://en.wikipedia.org/wiki/Three-address_code>.
		 * Every binary operation should take the form of `t1 := t2 + t3`.
		 * Nested operations such as `5 + 3 * 2`, instead of a tree-like structure:
		 * ```
		 * (ADD 5 (MUL 3 2))
		 * ```
		 * become flattened with the use of temporary locals:
		 * ```
		 * (SET $0 (MUL 3 2))        ;; t0 := 3 * 2
		 * (SET $1 (ADD 5 (GET $0))) ;; t1 := 5 + t0
		 * (GET $1)                  ;; t1
		 * ```
		 * Rather than returning `operation` directly, we set it to a temporary variable
		 * and then return that variable.
		 */
		const local_name: string = optimizer.newTempLocalName();
		optimizer.pushInstruction(new IR.Set(local_name, operation));
		return new IR.Get(local_name);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		return this.builder.module.call(new Map<Operator, string>([
			[Operator.EXP, 'vexp'],
			[Operator.MUL, 'vmul'],
			[Operator.DIV, 'vdiv'],
			[Operator.ADD, 'vadd'],
		]).get(this.operator)!, [this.operand0.build(), this.operand1.build()], binaryen.v128);
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type, int_coercion: boolean): TYPE.Type {
		if (t0.isBottomType || t1.isBottomType) {
			return TYPE.NEVER;
		}
		assert.ok(bothNumeric(t0, t1), new TypeErrorInvalidOperation(this));
		return (
			bothInts(t0, t1)   ? TYPE.INT :
			bothFloats(t0, t1) ? TYPE.FLOAT :
			int_coercion       ? eitherFloats(t0, t1) ? TYPE.FLOAT : t0.union(t1) :
			assert.fail(new TypeErrorInvalidOperation(this))
		);
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const v0: VALUE.Value | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		const v1: VALUE.Value | null = this.operand1.fold();
		if (!v1) {
			return v1;
		}
		if (this.operator === Operator.DIV && v1 instanceof VALUE.Number && v1.eq0()) {
			throw new NanErrorDivZero(this.operand1);
		}
		return (v0 instanceof VALUE.Integer && v1 instanceof VALUE.Integer)
			? this.foldNumeric(v0, v1)
			: this.foldNumeric(
				(v0 as VALUE.Number).toFloat(),
				(v1 as VALUE.Number).toFloat(),
			);
	}

	private foldNumeric<T extends VALUE.Number<T>>(v0: T, v1: T): T {
		try {
			return new Map<Operator, (x: T, y: T) => T>([
				[Operator.EXP, (x, y) => x.exp(y)],
				[Operator.MUL, (x, y) => x.times(y)],
				[Operator.DIV, (x, y) => x.divide(y)],
				[Operator.ADD, (x, y) => x.plus(y)],
				// [Operator.SUB, (x, y) => x.minus(y)],
			]).get(this.operator)!(v0, v1);
		} catch (err) {
			throw (err instanceof xjs.NaNError) ? new NanErrorInvalid(this) : err;
		}
	}
}
