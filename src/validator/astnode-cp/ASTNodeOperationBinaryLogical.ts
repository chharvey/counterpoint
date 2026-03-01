import binaryen from 'binaryen';
import {
	type VALUE,
	TYPE,
	type Optimizer,
	IR,
	drop_then,
	type Local,
	BinVect,
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
import {
	buildDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';
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

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		const mod:          binaryen.Module          = this.builder.module;
		const [arg0, arg1]: binaryen.ExpressionRef[] = this.children.map((operand) => operand.build());

		const t0:     TYPE.Type              = this.operand0.type();
		const block1: binaryen.ExpressionRef = drop_then(mod, [arg0], arg1);
		if (t0.isDefinitelyFalsy) {
			return this.operator === Operator.AND ? arg0 : block1;
		} else if (t0.isDefinitelyTruthy) {
			return this.operator === Operator.AND ? block1 : arg0;
		}

		const local0: Local = this.builder.addLocal(arg0);

		const arg0_truthy: binaryen.ExpressionRef = new BinVect(mod, mod.call(
			'vnot',
			[local0.tee()],
			binaryen.v128,
		)).isSpecial(false);

		return this.operator === Operator.AND
			? mod.if(arg0_truthy, arg1,         local0.get())
			: mod.if(arg0_truthy, local0.get(), arg1);
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
	public override lower(optimizer: Optimizer): IR.Value {
		/*
		 * `‹v0› && ‹v1›` desugars to:
		 * ```
		 * val left = ‹v0›;
		 * if !!left then ‹v1› else left
		 * ```
		 * IR Outline:
		 * ```
		 * (DECL result)
		 * (DECL left)
		 * (SET left ‹v0›)
		 * if_false (GET left), goto "else".
		 * (SET result ‹v1›) ;; evaluate right-hand value and set to result
		 * goto "endif".
		 * "else":
		 * (SET result (GET left)) ;; get left-hand variable and set to result
		 * "endif":
		 * return (GET result).
		 * ```
		 *
		 * `‹v0› || ‹v1›` desugars to:
		 * ```
		 * val left = ‹v0›;
		 * if !!left then left else ‹v1›
		 * ```
		 * IR Outline:
		 * ```
		 * (DECL result)
		 * (DECL left)
		 * (SET left ‹v0›)
		 * if_false (GET left), goto "else".
		 * (SET result (GET left)) ;; get left-hand variable and set to result
		 * goto "endif".
		 * "else":
		 * (SET result ‹v1›) ;; evaluate right-hand value and set to result
		 * "endif":
		 * return (GET result).
		 * ```
		 */

		// Assume `Operator.AND` first, then switch if `Operator.OR`.
		// We’re using functions because we want them to be run in the correct order.
		let branch_then = (_: IR.Value):          IR.Value => this.operand1.lower(optimizer);
		let branch_else = (left_value: IR.Value): IR.Value => left_value;
		if (this.operator === Operator.OR) {
			[branch_then, branch_else] = [branch_else, branch_then];
		}
		const left: IR.Value = this.operand0.lower(optimizer).asTac(optimizer);
		return IR.conditional_expression(
			optimizer,
			this.type(),
			() => new IR.Unop(IR.UnOp.TOBOOL, left, TYPE.BOOL),
			() => branch_then(left),
			() => branch_else(left),
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
