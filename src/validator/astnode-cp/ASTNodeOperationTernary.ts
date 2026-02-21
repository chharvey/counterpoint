import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {
	VALUE,
	TYPE,
	type IR,
	BinVect,
	TypeErrorInvalidOperation,
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
import type {Operator} from '../Operator.ts';
import {
	lowerDeco,
	buildDeco,
	typeDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';
import {ASTNodeOperation} from './ASTNodeOperation.ts';



export class ASTNodeOperationTernary extends ASTNodeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationTernary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationTernary);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		operator: Operator.COND,
		public readonly operand0: ASTNodeExpression,
		public readonly operand1: ASTNodeExpression,
		public readonly operand2: ASTNodeExpression,
	) {
		super(start_node, operator, [operand0, operand1, operand2]);
	}

	@memoizeMethod
	@lowerDeco
	public override lower(): IR.Instruction {
		throw new Error('`ASTNodeOperationTernary#lower` not yet supported.');
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		const t0:                 TYPE.Type                = this.operand0.type();
		const [arg0, arg1, arg2]: binaryen.ExpressionRef[] = this.children.map((operand) => operand.build());

		if (t0.equals(TYPE.FALSE)) {
			return this.builder.module.block(null, [
				this.builder.module.drop(arg0),
				arg2,
			], binaryen.v128);
		} else if (t0.equals(TYPE.TRUE)) {
			return this.builder.module.block(null, [
				this.builder.module.drop(arg0),
				arg1,
			], binaryen.v128);
		}

		return this.builder.module.if(new BinVect(this.builder.module, arg0).isSpecial(true), arg1, arg2);
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		// compute types early to rethrow any errors
		const [t0, t1, t2]: TYPE.Type[] = this.children.map((operand) => operand.type());
		assert.ok(t0.isSubtypeOf(TYPE.BOOL), new TypeErrorInvalidOperation(this));
		return (
			t0.isBottomType       ? TYPE.NEVER :
			t0.equals(TYPE.FALSE) ? t2 : // If `typeof a` is `false`, then `typeof (if a then b else c)` is `typeof c`.
			t0.equals(TYPE.TRUE)  ? t1 : // If `typeof a` is `true`,  then `typeof (if a then b else c)` is `typeof b`.
			t1.union(t2)
		);
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const v0: VALUE.Value | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		return (v0 === VALUE.TRUE)
			? this.operand1.fold()
			: this.operand2.fold();
	}
}
