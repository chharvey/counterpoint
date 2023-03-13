import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	TypeError01,
	NanError01,
	throw_expression,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeSupertype,
	Operator,
	ValidOperatorUnary,
} from './package.js';
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

	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionUnop {
		const tofloat: boolean = to_float || this.shouldFloat();
		return new INST.InstructionUnop(
			this.operator,
			this.operand.build(builder, tofloat),
		);
	}

	protected override type_do(): TYPE.Type {
		const t0: TYPE.Type = this.operand.type();
		return (
			(this.operator === Operator.NOT) ? (() => (
				(t0.isSubtypeOf(TYPE.Type.VOID.union(TYPE.Type.NULL).union(OBJ.Boolean.FALSETYPE)))                         ? OBJ.Boolean.TRUETYPE :
				(TYPE.Type.VOID.isSubtypeOf(t0) || TYPE.Type.NULL.isSubtypeOf(t0) || OBJ.Boolean.FALSETYPE.isSubtypeOf(t0)) ? TYPE.Type.BOOL       :
				OBJ.Boolean.FALSETYPE
			))() :
			(this.operator === Operator.EMP) ? TYPE.Type.BOOL :
			(this.operator === Operator.NEG, ( // eslint-disable-line @typescript-eslint/no-unnecessary-condition --- TODO: use a runtime asertion here
				(t0.isSubtypeOf(TYPE.Type.INT.union(TYPE.Type.FLOAT)))
					? t0
					: throw_expression(new TypeError01(this))
			))
		);
	}

	protected override fold_do(): OBJ.Object | null {
		const v0: OBJ.Object | null = this.operand.fold();
		if (!v0) {
			return v0;
		}
		return (
			(this.operator === Operator.NOT) ? OBJ.Boolean.fromBoolean(!v0.isTruthy) :
			(this.operator === Operator.EMP) ? OBJ.Boolean.fromBoolean(!v0.isTruthy || v0.isEmpty) :
			(this.operator === Operator.NEG) ? this.foldNumeric(v0 as OBJ.Number<any>) : // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-condition --- cyclical types
			throw_expression(new ReferenceError(`Operator ${ Operator[this.operator] } not found.`))
		);
	}

	private foldNumeric<T extends OBJ.Number<T>>(v0: T): T {
		try {
			return new Map<Operator, (z: T) => T>([
				[Operator.AFF, (z) => z],
				[Operator.NEG, (z) => z.neg()],
			]).get(this.operator)!(v0);
		} catch (err) {
			throw (err instanceof xjs.NaNError) ? new NanError01(this) : err;
		}
	}
}
