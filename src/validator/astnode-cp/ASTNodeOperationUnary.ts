import * as assert from 'assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	type Builder,
	BinVect,
	TypeError01,
	NanError01,
} from '../../index.js';
import {
	throw_expression,
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeSupertype} from '../utils-private.js';
import {
	Operator,
	type ValidOperatorUnary,
} from '../Operator.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



export class ASTNodeOperationUnary extends ASTNodeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationUnary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationUnary);
		return expression;
	}

	/**
	 * Return an instruction performing an operation on an argument.
	 * @param mod the binaryen module
	 * @param op  the operator
	 * @param arg the operand
	 * @return    an instruction that performs the operation at runtime
	 */
	public static operate(
		mod: binaryen.Module,
		op:  ValidOperatorUnary,
		arg: binaryen.ExpressionRef,
	): binaryen.ExpressionRef {
		const bintype: binaryen.Type = binaryen.getExpressionType(arg);
		if (bintype === binaryen.v128) {
			const vect = new BinVect(mod, {int_float: arg});

			let op_int:   binaryen.ExpressionRef = ASTNodeOperationUnary.operate(mod, op, vect.intValue);
			let op_float: binaryen.ExpressionRef = ASTNodeOperationUnary.operate(mod, op, vect.floatValue);

			if (op === Operator.NEG) {
				[op_int, op_float] = [op_int, op_float].map((op_) => new BinVect(mod, op_).vect);
			}

			assert.strictEqual(binaryen.getExpressionType(op_int), binaryen.getExpressionType(op_float));
			return mod.if(vect.isInt, op_int, op_float);
		} else {
			ASTNodeOperation.expectIntOrFloat(bintype);
			return (op === Operator.NEG && bintype === binaryen.f64)
				? mod.f64.neg(arg)
				: mod.call(new Map<binaryen.Type, ReadonlyMap<Operator, string>>([
					[binaryen.i32, new Map<Operator, string>([
						[Operator.NOT, 'inot'],
						[Operator.EMP, 'iemp'],
						[Operator.NEG, 'neg'],
					])],
					[binaryen.f64, new Map<Operator, string>([
						[Operator.NOT, 'fnot'],
						[Operator.EMP, 'femp'],
					])],
				]).get(bintype)!.get(op)!, [arg], binaryen.i32);
		}
	}


	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		private readonly operator: ValidOperatorUnary,
		public  readonly operand:  ASTNodeExpression,
	) {
		super(start_node, operator, [operand]);
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): binaryen.ExpressionRef {
		return ASTNodeOperationUnary.operate(builder.module, this.operator, this.operand.build(builder));
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		const t0: TYPE.Type = this.operand.type();
		/* eslint-disable indent */
		return (
			(this.operator === Operator.NOT) ? (
				(t0.isSubtypeOf(TYPE.VOID.union(TYPE.NULL).union(OBJ.Boolean.FALSETYPE)))                         ? OBJ.Boolean.TRUETYPE :
				(TYPE.VOID.isSubtypeOf(t0) || TYPE.NULL.isSubtypeOf(t0) || OBJ.Boolean.FALSETYPE.isSubtypeOf(t0)) ? TYPE.BOOL            :
				OBJ.Boolean.FALSETYPE
			) :
			(this.operator === Operator.EMP) ? TYPE.BOOL :
			(assert.strictEqual(this.operator, Operator.NEG), (
				(t0.isSubtypeOf(TYPE.INT.union(TYPE.FLOAT)))
					? t0
					: throw_expression(new TypeError01(this))
			))
		);
		/* eslint-enable indent */
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const v0: OBJ.Object | null = this.operand.fold();
		if (!v0) {
			return v0;
		}
		return (
			(this.operator === Operator.NOT) ?                OBJ.Boolean.fromBoolean(!v0.isTruthy)               :
			(this.operator === Operator.EMP) ?                OBJ.Boolean.fromBoolean(!v0.isTruthy || v0.isEmpty) :
			(assert.strictEqual(this.operator, Operator.NEG), this.foldNumeric(v0 as OBJ.Number<any>)) // eslint-disable-line @typescript-eslint/no-explicit-any --- cyclical types
		);
	}

	private foldNumeric<T extends OBJ.Number<T>>(v0: T): T {
		try {
			return new Map<Operator, (z: T) => T>([
				[Operator.AFF, (z) => z],
				[Operator.NEG, (z) => z.neg()],
			]).get(this.operator)!(v0);
		} catch (err) {
			throw (err instanceof xjs.NaNError) ? new NanError01(this) : err;
		}
	}
}
