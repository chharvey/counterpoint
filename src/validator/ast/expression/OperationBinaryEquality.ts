import {
	type Builder,
	OP,
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
	type ValidOperatorEquality,
} from '../../Operator.ts';
import {Expression} from './Expression.ts';
import {OperationBinary} from './OperationBinary.ts';



export class OperationBinaryEquality extends OperationBinary {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationBinaryEquality {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, OperationBinaryEquality);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorEquality,
		operand0: Expression,
		operand1: Expression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type): TYPE.Type {
		if (t0.isBottomType || t1.isBottomType) {
			return TYPE.NOTHING;
		}
		const DISJOINT_TYPES = t0.isDisjointWith(t1);
		switch (this.operator) {
			case Operator.ID: {
				/*
				 * Identity:
				 * - If      the types of `a` and `b` are disjoint, then `a === b` will always evaluate to false.
				 * - Else if the types of `a` and `b` intersect,    then `a === b` could evaluate to true.
				 */
				return DISJOINT_TYPES ? TYPE.FALSE : TYPE.BOOL;
			}
			case Operator.EQ: {
				/*
				 * Equality:
				 * - If the types of `a` and `b` are disjoint,
				 * 	*and* any of `a` or `b` is disjoint with the Number type (it cannot contain numbers),
				 * 	then `a == b` will always evaluate to false.
				 * - Else if the types of `a` and `b` intersect,
				 * 	*or* both `a` and `b` intersect with the Number type (they both might contain numbers),
				 * 	then `a == b` could evaluate to true.
				 */
				return DISJOINT_TYPES && [t0, t1].some((t) => t.isDisjointWith(TYPE.NUMBER)) ? TYPE.FALSE : TYPE.BOOL;
			}
			default: {
				return TYPE.BOOL;
			}
		}
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Binop {
		return new OP.Binop(new Map<Operator, OP.OpCodeBin>([
			[Operator.ID,  OP.OpCode.ID],
			[Operator.EQ,  OP.OpCode.EQ],
			[Operator.NID, OP.OpCode.NID],
			[Operator.NEQ, OP.OpCode.NEQ],
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
		return this.foldEquality(v0, v1);
	}

	private foldEquality(v0: VALUE.Value, v1: VALUE.Value): VALUE.Boolean {
		return VALUE.Boolean.fromBoolean(new Map<Operator, (x: VALUE.Value, y: VALUE.Value) => boolean>([
			[Operator.ID,  (x, y) => x.identical(y)],
			[Operator.EQ,  (x, y) => x.equal(y)],
			[Operator.NID, (x, y) => !x.identical(y)],
			[Operator.NEQ, (x, y) => !x.equal(y)],
		]).get(this.operator)!(v0, v1));
	}
}
