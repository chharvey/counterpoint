import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	OBJ,
	TYPE,
	TypeError01,
} from '../../index.js';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeSupertype} from '../utils-private.js';
import type {Operator} from '../Operator.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



export class ASTNodeOperationTernary extends ASTNodeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationTernary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationTernary);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		operator: Operator.COND,
		private readonly operand0: ASTNodeExpression,
		private readonly operand1: ASTNodeExpression,
		private readonly operand2: ASTNodeExpression,
	) {
		super(start_node, operator, [operand0, operand1, operand2]);
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(): binaryen.ExpressionRef {
		return this.builder.module.if(
			this.operand0.build(),
			this.operand1.build(),
			this.operand2.build(),
		);
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		const t0: TYPE.Type = this.operand0.type();
		const t1: TYPE.Type = this.operand1.type();
		const t2: TYPE.Type = this.operand2.type();
		assert.ok(t0.isSubtypeOf(TYPE.BOOL), new TypeError01(this));
		return (
			t0.isBottomType                  ? TYPE.NEVER :
			t0.equals(OBJ.Boolean.FALSETYPE) ? t2 : // If `typeof a` is `false`, then `typeof (if a then b else c)` is `typeof c`.
			t0.equals(OBJ.Boolean.TRUETYPE)  ? t1 : // If `typeof a` is `true`,  then `typeof (if a then b else c)` is `typeof b`.
			t1.union(t2)
		);
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const v0: OBJ.Object | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		return (v0 === OBJ.Boolean.TRUE)
			? this.operand1.fold()
			: this.operand2.fold();
	}
}
