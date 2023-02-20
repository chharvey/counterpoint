import * as assert from 'assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	Builder,
	TypeError01,
	NanError01,
} from '../../index.js';
import {throw_expression} from '../../lib/index.js';
import {
	CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeSupertype} from '../utils-private.js';
import {
	Operator,
	ValidOperatorUnary,
} from '../Operator.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



export class ASTNodeOperationUnary extends ASTNodeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationUnary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationUnary);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		private readonly operator: ValidOperatorUnary,
		public  readonly operand:  ASTNodeExpression,
	) {
		super(start_node, operator, [operand]);
	}

	/**
	 * Return an instruction performing the operation on the argument.
	 * @param mod   the binaryen module
	 * @param type_ the compile-time type of the operand
	 * @param arg   the operand
	 * @return      an instruction that performs the operation at runtime
	 */
	private operate(mod: binaryen.Module, type_: TYPE.Type, arg: binaryen.ExpressionRef): binaryen.ExpressionRef {
		const bintype: binaryen.Type = binaryen.getExpressionType(arg);
		assert.strictEqual(bintype, type_.binType());
		if (type_ instanceof TYPE.TypeUnion) {
			// assert: `arg` is equivalent to a result of `Builder.createBinEither()`
			return Builder.createBinEither(
				mod,
				mod.tuple.extract(arg, 0),
				this.operate(mod, type_.left,  mod.tuple.extract(arg, 1)),
				this.operate(mod, type_.right, mod.tuple.extract(arg, 2)),
			);
		} else {
			ASTNodeOperation.expectIntOrFloat(bintype);
			return (this.operator === Operator.NEG && bintype === binaryen.f64)
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
				]).get(bintype)!.get(this.operator)!, [arg], binaryen.i32);
		}
	}

	protected override build_do(builder: Builder): binaryen.ExpressionRef {
		return this.operate(builder.module, this.operand.type(), this.operand.build(builder));
	}

	protected override type_do(): TYPE.Type {
		const t0: TYPE.Type = this.operand.type();
		return (
			(this.operator === Operator.NOT) ? (() => (
				(t0.isSubtypeOf(TYPE.VOID.union(TYPE.NULL).union(OBJ.Boolean.FALSETYPE)))                         ? OBJ.Boolean.TRUETYPE :
				(TYPE.VOID.isSubtypeOf(t0) || TYPE.NULL.isSubtypeOf(t0) || OBJ.Boolean.FALSETYPE.isSubtypeOf(t0)) ? TYPE.BOOL            :
				OBJ.Boolean.FALSETYPE
			))() :
			(this.operator === Operator.EMP) ? TYPE.BOOL :
			(this.operator === Operator.NEG, ( // eslint-disable-line @typescript-eslint/no-unnecessary-condition
				(t0.isSubtypeOf(TYPE.INT.union(TYPE.FLOAT)))
					? t0
					: throw_expression(new TypeError01(this))
			))
		);
	}

	protected override fold_do(): OBJ.Object | null {
		const v0: OBJ.Object | null = this.operand.fold();
		if (!v0) {
			return v0;
		}
		return (
			(this.operator === Operator.NOT) ? OBJ.Boolean.fromBoolean(!v0.isTruthy) :
			(this.operator === Operator.EMP) ? OBJ.Boolean.fromBoolean(!v0.isTruthy || v0.isEmpty) :
			(this.operator === Operator.NEG) ? this.foldNumeric(v0 as OBJ.Number<any>) : // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-condition --- cyclical types
			throw_expression(new ReferenceError(`Operator ${ Operator[this.operator] } not found.`))
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
