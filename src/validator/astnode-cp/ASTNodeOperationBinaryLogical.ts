import {
	type VALUE,
	TYPE,
	type Optimizer,
	IR,
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
	type ValidOperatorLogical,
} from '../Operator.ts';
import {ASTNodeExpression} from './ASTNodeExpression.ts';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.ts';



export class ASTNodeOperationBinaryLogical extends ASTNodeOperationBinary {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryLogical {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationBinaryLogical);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorLogical,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
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
	public override lower(optimizer: Optimizer): IR.Phi {
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
		const left: IR.Value = this.operand0.lower(optimizer).asTac(optimizer);

		// Assume `Operator.AND` first, then switch if `Operator.OR`.
		let conseq = (): IR.Value => this.operand1.lower(optimizer);
		let altern = (): IR.Value => left;
		if (this.operator === Operator.OR) {
			[conseq, altern] = [altern, conseq];
		}

		return IR.conditional_expression(
			optimizer,
			() => new IR.Unop(IR.OpCode.TOBOOL, left, TYPE.BOOL),
			conseq,
			altern,
		);
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const v0: VALUE.Value | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		if (
			this.operator === Operator.AND && !v0.isTruthy ||
			this.operator === Operator.OR  &&  v0.isTruthy
		) {
			return v0;
		}
		return this.operand1.fold();
	}
}
