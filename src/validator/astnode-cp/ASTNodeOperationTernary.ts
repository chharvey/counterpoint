import * as assert from 'assert';
import {
	OBJ,
	TYPE,
	INST,
	Builder,
	TypeError01,
} from '../../index.js';
import {throw_expression} from '../../lib/index.js';
import {
	CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeSupertype} from '../utils-private.js';
import type {Operator} from '../Operator.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



export class ASTNodeOperationTernary extends ASTNodeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationTernary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationTernary);
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

	public override shouldFloat(): boolean {
		return this.operand1.shouldFloat() || this.operand2.shouldFloat();
	}

	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionCond {
		const tofloat: boolean = to_float || this.shouldFloat();
		return new INST.InstructionCond(
			this.operand0.build(builder, false),
			this.operand1.build(builder, tofloat),
			this.operand2.build(builder, tofloat),
		);
	}

	protected override type_do(): TYPE.Type {
		const t0: TYPE.Type = this.operand0.type();
		const t1: TYPE.Type = this.operand1.type();
		const t2: TYPE.Type = this.operand2.type();
		return (t0.isSubtypeOf(TYPE.BOOL))
			? (
				(t0.equals(TYPE.BOOL))           ? t1.union(t2) :
				(t0.includes(OBJ.Boolean.FALSE)) ? t2           : // If `typeof a` is `false`, then `typeof (if a then b else c)` is `typeof c`.
				(t0.includes(OBJ.Boolean.TRUE))  ? t1           : // If `typeof a` is `true`,  then `typeof (if a then b else c)` is `typeof b`.
				(t0.isBottomType,                  TYPE.NEVER)
			)
			: throw_expression(new TypeError01(this));
	}

	protected override fold_do(): OBJ.Object | null {
		const v0: OBJ.Object | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		return (v0 === OBJ.Boolean.TRUE)
			? this.operand1.fold()
			: this.operand2.fold();
	}
}
