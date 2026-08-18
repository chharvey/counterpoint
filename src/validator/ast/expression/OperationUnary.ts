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
import {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import {
	Operator,
	type ValidOperatorUnary,
} from '../../Operator.ts';
import {Expression} from './Expression.ts';
import {Operation} from './Operation.ts';



export class OperationUnary extends Operation {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationUnary {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, OperationUnary);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		private readonly operator: ValidOperatorUnary,
		private readonly operand:  Expression,
	) {
		super(start_node, operator, [operand]);
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		const t: TYPE.Type = this.operand.type();
		if (t.isBottomType) {
			return TYPE.NOTHING;
		}
		switch (this.operator) {
			case Operator.NOT: {
				return (
					t.isDefinitelyFalsy  ? TYPE.TRUE :
					t.isDefinitelyTruthy ? TYPE.FALSE :
					TYPE.BOOL
				);
			}
			case Operator.EMP: {
				return t.isDefinitelyFalsy ? TYPE.TRUE : TYPE.BOOL;
			}
			case Operator.NEG: {
				return t.isSubtypeOf(TYPE.INT.union(TYPE.FLOAT)) ? t : assert.fail(new TypeErrorInvalidOperation(this));
			}
		}
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Unop {
		return new OP.Unop(new Map<Operator, OP.OpCodeUn>([
			[Operator.NOT, OP.OpCode.NOT],
			[Operator.EMP, OP.OpCode.EMP],
			[Operator.NEG, OP.OpCode.NEG],
		]).get(this.operator)!, this.operand.build(builder).asTac(builder), this.type());
	}
}
