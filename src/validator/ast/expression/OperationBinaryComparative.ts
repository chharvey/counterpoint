import * as assert from 'node:assert';
import {
	type Builder,
	OP,
	TypeErrorInvalidOperation,
} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import {
	Operator,
	type ValidOperatorComparative,
} from '../../Operator.ts';
import {bothNumbers} from '../utils-private.ts';
import {Expression} from './Expression.ts';
import {OperationBinary} from './OperationBinary.ts';



export class OperationBinaryComparative extends OperationBinary {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationBinaryComparative {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, OperationBinaryComparative);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorComparative,
		operand0: Expression,
		operand1: Expression,
	) {
		super(start_node, operator, operand0, operand1);
		if ([Operator.IS, Operator.ISNT].includes(this.operator)) {
			throw new TypeError(`Operator ${ this.operator } not yet supported.`);
		}
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type): TYPE.Type {
		if (t0.isBottomType || t1.isBottomType) {
			return TYPE.NOTHING;
		}
		return (
			bothNumbers(t0, t1) ? TYPE.BOOL :
			assert.fail(new TypeErrorInvalidOperation(this))
		);
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Binop {
		return new OP.Binop(new Map<Operator, OP.OpCodeBin>([
			[Operator.LT,  OP.OpCode.LT],
			[Operator.GT,  OP.OpCode.GT],
			[Operator.LE,  OP.OpCode.LE],
			[Operator.GE,  OP.OpCode.GE],
			[Operator.NLT, OP.OpCode.NLT],
			[Operator.NGT, OP.OpCode.NGT],
		]).get(this.operator)!, this.operand0.build(builder).asTac(builder), this.operand1.build(builder).asTac(builder), this.type());
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
		return this.foldComparative(
			(v0 as VALUE.Number<VALUE.Integer | VALUE.Float>),
			(v1 as VALUE.Number<VALUE.Integer | VALUE.Float>),
		);
	}

	private foldComparative<T extends VALUE.Number<T>>(v0: T, v1: T): VALUE.Boolean {
		return VALUE.Boolean.fromBoolean(new Map<Operator, (x: T, y: T) => boolean>([
			[Operator.LT, (x, y) => x.lt(y)],
			[Operator.GT, (x, y) => y.lt(x)],
			[Operator.LE, (x, y) => x.equal(y) || x.lt(y)],
			[Operator.GE, (x, y) => x.equal(y) || y.lt(x)],
			[Operator.NLT, (x, y) => !x.lt(y)],
			[Operator.NGT, (x, y) => !y.lt(x)],
		]).get(this.operator)!(v0, v1));
	}
}
