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
import {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import {
	Operator,
	type ValidOperatorLogical,
} from '../../Operator.ts';
import {Expression} from './Expression.ts';
import {OperationBinary} from './OperationBinary.ts';



export class OperationBinaryLogical extends OperationBinary {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationBinaryLogical {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, OperationBinaryLogical);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorLogical,
		operand0: Expression,
		operand1: Expression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type): TYPE.Type {
		if (t0.isBottomType) {
			return TYPE.NOTHING;
		}
		switch (this.operator) {
			case Operator.AND: {
				return (
					t0.isDefinitelyFalsy  ? t0 :
					t0.isDefinitelyTruthy ? t1 :
					t0.falsySide.union(t1)
				);
			}
			case Operator.OR: {
				return (
					t0.isDefinitelyFalsy  ? t1 :
					t0.isDefinitelyTruthy ? t0 :
					t0.truthySide.union(t1)
				);
			}
		}
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Get {
		/*
		 * `‹v0› && ‹v1›` desugars to:
		 * ```
		 * val left = ‹v0›;
		 * if !!left then ‹v1› else left
		 * ```
		 *
		 * `‹v0› || ‹v1›` desugars to:
		 * ```
		 * val left = ‹v0›;
		 * if !!left then left else ‹v1›
		 * ```
		 */
		const left: OP.ValueTac = this.operand0.build(builder).asTac(builder);

		// Assume `Operator.AND` first, then switch if `Operator.OR`.
		let conseq = (): OP.Value => this.operand1.build(builder);
		let altern = (): OP.Value => left;
		if (this.operator === Operator.OR) {
			[conseq, altern] = [altern, conseq];
		}

		return OP.conditional_expression(
			builder,
			this.operand0.type().union(this.operand1.type()), // TODO: turn typeCheck optimization off and just use `this.type()` here
			() => new OP.Unop(OP.OpCode.TOBOOL, left, TYPE.BOOL),
			conseq,
			altern,
		);
	}
}
