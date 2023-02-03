import * as assert from 'assert';
import * as xjs from 'extrajs'
import {
	SolidType,
	SolidObject,
	SolidBoolean,
	SolidNumber,
	INST,
	Builder,
	TypeError01,
	NanError01,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	Operator,
	ValidOperatorUnary,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



export class ASTNodeOperationUnary extends ASTNodeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationUnary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationUnary);
		return expression;
	}
	constructor(
		start_node: ParseNode,
		readonly operator: ValidOperatorUnary,
		readonly operand: ASTNodeExpression,
	) {
		super(start_node, operator, [operand]);
	}
	protected override build_do(builder: Builder): INST.InstructionUnop {
		return new INST.InstructionUnop(this.operator, this.operand.build(builder));
	}
	protected override type_do(): SolidType {
		const t0: SolidType = this.operand.type();
		return (
			(this.operator === Operator.NOT) ? (
				(t0.isSubtypeOf(SolidType.VOID.union(SolidType.NULL).union(SolidBoolean.FALSETYPE))) ? SolidBoolean.TRUETYPE :
				(SolidType.VOID.isSubtypeOf(t0) || SolidType.NULL.isSubtypeOf(t0) || SolidBoolean.FALSETYPE.isSubtypeOf(t0)) ? SolidType.BOOL :
				SolidBoolean.FALSETYPE
			) :
			(this.operator === Operator.EMP) ? SolidType.BOOL :
			/* (this.operator === Operator.NEG) */ (t0.isSubtypeOf(SolidType.INT.union(SolidType.FLOAT)))
				? t0
				: (() => { throw new TypeError01(this); })()
		);
	}
	protected override fold_do(): SolidObject | null {
		const v0: SolidObject | null = this.operand.fold();
		if (!v0) {
			return v0;
		}
		return (
			(this.operator === Operator.NOT) ? SolidBoolean.fromBoolean(!v0.isTruthy) :
			(this.operator === Operator.EMP) ? SolidBoolean.fromBoolean(!v0.isTruthy || v0.isEmpty) :
			(this.operator === Operator.NEG) ? this.foldNumeric(v0 as SolidNumber<any>) :
			(() => { throw new ReferenceError(`Operator ${ Operator[this.operator] } not found.`) })()
		)
	}
	private foldNumeric<T extends SolidNumber<T>>(z: T): T {
		try {
			return new Map<Operator, (z: T) => T>([
				[Operator.AFF, (z) => z],
				[Operator.NEG, (z) => z.neg()],
			]).get(this.operator)!(z)
		} catch (err) {
			throw (err instanceof xjs.NaNError) ? new NanError01(this) : err;
		}
	}
}
