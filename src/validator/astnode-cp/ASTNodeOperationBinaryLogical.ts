import binaryen from 'binaryen';
import {
	type VALUE,
	TYPE,
	type IrLocal,
	type Optimizer,
	IR,
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
		// eslint-disable-next-line prefer-const --- one of them is reassigned
		let [arg0, arg1]: binaryen.ExpressionRef[] = this.children.map((operand) => operand.build());

		const t0:     TYPE.Type              = this.operand0.type();
		const block1: binaryen.ExpressionRef = this.builder.module.block(null, [
			this.builder.module.drop(arg0),
			arg1,
		], binaryen.v128);
		if (t0.isDefinitelyFalsy) {
			return this.operator === Operator.AND ? arg0 : block1;
		} else if (t0.isDefinitelyTruthy) {
			return this.operator === Operator.AND ? block1 : arg0;
		}

		const local: Local = this.builder.addLocal(arg0)[1];

		const condition: binaryen.ExpressionRef = new BinVect(this.builder.module, this.builder.module.call(
			'vnot',
			[local.tee()],
			binaryen.v128,
		)).isSpecial(false);
		arg0 = local.get();

		const [if_true, if_false] = (this.operator === Operator.AND) ? [arg1, arg0] : [arg0, arg1];
		return this.builder.module.if(condition, if_true, if_false);
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type): TYPE.Type {
		if (t0.isBottomType) {
			return TYPE.NEVER;
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
		const typ: IR.Type = IR.Type.fromAstType(this.type());
		/*
		 * `‹v0› && ‹v1›` desugars to:
		 * ```
		 * val left = ‹v0›;
		 * if left then ‹v1› else left;
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
		 * if left then left else ‹v1›;
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

		const block_else:  string = optimizer.newLabel();
		const block_endif: string = optimizer.newLabel();

		// Assume `Operator.AND` first, then switch if `Operator.OR`.
		// We’re using functions because we want them to be run in the correct order.
		let branch_then = (_: IrLocal):          IR.Value => this.operand1.lower(optimizer);
		let branch_else = (left_local: IrLocal): IR.Value => new IR.Get(left_local);
		if (this.operator === Operator.OR) {
			[branch_then, branch_else] = [branch_else, branch_then];
		}

		const result: IrLocal = optimizer.newTempLocal(typ);
		const left:   IrLocal = optimizer.newTempLocal(this.operand0.lower(optimizer));

		optimizer.pushInstruction(new IR.GotoIfFalse(new IR.Unop(IR.UnOp.TOBOOL, new IR.Get(left), IR.Type.BOOL), block_else));
		optimizer.pushInstruction(new IR.Set(result, branch_then(left)));
		optimizer.pushInstruction(new IR.Goto(block_endif));
		optimizer.pushInstruction(new IR.Label(block_else));
		optimizer.pushInstruction(new IR.Set(result, branch_else(left)));
		optimizer.pushInstruction(new IR.Label(block_endif));
		return new IR.Get(result);
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
