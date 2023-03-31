import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	INST,
	type Builder,
	TypeErrorInvalidOperation,
	NanErrorInvalid,
} from '../../index.js';
import {
	throw_expression,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeSupertype} from '../utils-private.js';
import {
	Operator,
	type ValidOperatorUnary,
} from '../Operator.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



export class ASTNodeOperationUnary extends ASTNodeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationUnary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationUnary);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		private readonly operator: ValidOperatorUnary,
		private readonly operand:  ASTNodeExpression,
	) {
		super(start_node, operator, [operand]);
	}

	public override shouldFloat(): boolean {
		return this.operand.shouldFloat();
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder, to_float: boolean = false): INST.InstructionConst | INST.InstructionUnop {
		const tofloat: boolean = to_float || this.shouldFloat();
		return new INST.InstructionUnop(
			this.operator,
			this.operand.build(builder, tofloat),
		);
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		const t: TYPE.Type = this.operand.type();
		/* eslint-disable indent */
		return (
			(this.operator === Operator.NOT) ? (
				(t.isSubtypeOf(TYPE.VOID.union(TYPE.NULL).union(OBJ.Boolean.FALSETYPE)))                       ? OBJ.Boolean.TRUETYPE :
				(TYPE.VOID.isSubtypeOf(t) || TYPE.NULL.isSubtypeOf(t) || OBJ.Boolean.FALSETYPE.isSubtypeOf(t)) ? TYPE.BOOL            :
				OBJ.Boolean.FALSETYPE
			) :
			(this.operator === Operator.EMP) ? TYPE.BOOL :
			(assert.strictEqual(this.operator, Operator.NEG), (
				(t.isSubtypeOf(TYPE.INT.union(TYPE.FLOAT)))
					? t
					: throw_expression(new TypeErrorInvalidOperation(this))
			))
		);
		/* eslint-enable indent */
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const v: OBJ.Object | null = this.operand.fold();
		if (!v) {
			return v;
		}
		return (
			(this.operator === Operator.NOT) ?                OBJ.Boolean.fromBoolean(!v.isTruthy)              :
			(this.operator === Operator.EMP) ?                OBJ.Boolean.fromBoolean(!v.isTruthy || v.isEmpty) :
			(assert.strictEqual(this.operator, Operator.NEG), this.foldNumeric(v as OBJ.Number<any>)) // eslint-disable-line @typescript-eslint/no-explicit-any --- cyclical types
		);
	}

	private foldNumeric<T extends OBJ.Number<T>>(v0: T): T {
		try {
			return new Map<Operator, (z: T) => T>([
				[Operator.AFF, (z) => z],
				[Operator.NEG, (z) => z.neg()],
			]).get(this.operator)!(v0);
		} catch (err) {
			throw (err instanceof xjs.NaNError) ? new NanErrorInvalid(this) : err;
		}
	}
}
