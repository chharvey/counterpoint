import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	OBJ,
	TYPE,
	Builder,
	TypeError01,
} from '../../index.js';
import {
	CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeSupertype} from '../utils-private.js';
import {
	Operator,
	ValidOperatorComparative,
} from '../Operator.js';
import {
	bothNumeric,
	bothFloats,
	neitherFloats,
} from './utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';



export class ASTNodeOperationBinaryComparative extends ASTNodeOperationBinary {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryComparative {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryComparative);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorComparative,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
		if ([Operator.IS, Operator.ISNT].includes(this.operator)) {
			throw new TypeError(`Operator ${ this.operator } not yet supported.`);
		}
	}

	protected override build_do(builder: Builder): binaryen.ExpressionRef {
		const args: readonly [binaryen.ExpressionRef, binaryen.ExpressionRef] = ASTNodeOperation.coerceOperands(builder, this.operand0, this.operand1);
		const opname = new Map<Operator, 'lt' | 'gt' | 'le' | 'ge'>([
			[Operator.LT, 'lt'],
			[Operator.GT, 'gt'],
			[Operator.LE, 'le'],
			[Operator.GE, 'ge'],
		]).get(this.operator)!;
		return ((!args.map((arg) => binaryen.getExpressionType(arg)).includes(binaryen.f64))
			? builder.module.i32[`${ opname }_s`]
			: builder.module.f64[opname])(...args);
	}

	protected override type_do_do(t0: TYPE.Type, t1: TYPE.Type, int_coercion: boolean): TYPE.Type {
		if (bothNumeric(t0, t1) && (int_coercion || (
			bothFloats(t0, t1) || neitherFloats(t0, t1)
		))) {
			return TYPE.BOOL;
		}
		throw new TypeError01(this);
	}

	protected override fold_do(): OBJ.Object | null {
		const v0: OBJ.Object | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		const v1: OBJ.Object | null = this.operand1.fold();
		if (!v1) {
			return v1;
		}
		return (v0 instanceof OBJ.Integer && v1 instanceof OBJ.Integer)
			? this.foldComparative(v0, v1)
			: this.foldComparative(
				(v0 as OBJ.Number).toFloat(),
				(v1 as OBJ.Number).toFloat(),
			);
	}

	private foldComparative<T extends OBJ.Number<T>>(v0: T, v1: T): OBJ.Boolean {
		return OBJ.Boolean.fromBoolean(new Map<Operator, (x: T, y: T) => boolean>([
			[Operator.LT, (x, y) => x.lt(y)],
			[Operator.GT, (x, y) => y.lt(x)],
			[Operator.LE, (x, y) => x.equal(y) || x.lt(y)],
			[Operator.GE, (x, y) => x.equal(y) || y.lt(x)],
			// [Operator.NLT, (x, y) => !x.lt(y)],
			// [Operator.NGT, (x, y) => !y.lt(x)],
		]).get(this.operator)!(v0, v1));
	}
}
