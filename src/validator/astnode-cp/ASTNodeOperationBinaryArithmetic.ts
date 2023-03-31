import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	INST,
	type Builder,
	TypeErrorInvalidOperation,
	NanErrorInvalid,
	NanErrorDivZero,
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
	type ValidOperatorArithmetic,
} from '../Operator.js';
import {
	bothNumeric,
	eitherFloats,
	bothFloats,
	neitherFloats,
} from './utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';



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
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder, to_float: boolean = false): INST.InstructionConst | INST.InstructionBinopArithmetic {
		const tofloat: boolean = to_float || this.shouldFloat();
		return new INST.InstructionBinopArithmetic(
			this.operator,
			this.operand0.build(builder, tofloat),
			this.operand1.build(builder, tofloat),
		);
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type, int_coercion: boolean): TYPE.Type {
		return (bothNumeric(t0, t1))
			? (int_coercion)
				? (eitherFloats(t0, t1))
					? TYPE.FLOAT
					: TYPE.INT
				: (
					(bothFloats   (t0, t1)) ? TYPE.FLOAT :
					(neitherFloats(t0, t1)) ? TYPE.INT   :
					throw_expression(new TypeErrorInvalidOperation(this))
				)
			: throw_expression(new TypeErrorInvalidOperation(this));
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const v0: OBJ.Object | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		const v1: OBJ.Object | null = this.operand1.fold();
		if (!v1) {
			return v1;
		}
		if (this.operator === Operator.DIV && v1 instanceof OBJ.Number && v1.eq0()) {
			throw new NanErrorDivZero(this.operand1);
		}
		return (v0 instanceof OBJ.Integer && v1 instanceof OBJ.Integer)
			? this.foldNumeric(v0, v1)
			: this.foldNumeric(
				(v0 as OBJ.Number).toFloat(),
				(v1 as OBJ.Number).toFloat(),
			);
	}

	private foldNumeric<T extends OBJ.Number<T>>(v0: T, v1: T): T {
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
