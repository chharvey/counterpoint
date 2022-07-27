import * as assert from 'assert';
import * as xjs from 'extrajs'
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	TypeError01,
	NanError01,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeSupertype,
	Operator,
	ValidOperatorUnary,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



export class ASTNodeOperationUnary extends ASTNodeOperation {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationUnary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationUnary);
		return expression;
	}
	constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		readonly operator: ValidOperatorUnary,
		readonly operand: ASTNodeExpression,
	) {
		super(start_node, operator, [operand]);
	}
	override shouldFloat(): boolean {
		return this.operand.shouldFloat();
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionUnop {
		const tofloat: boolean = to_float || this.shouldFloat();
		return new INST.InstructionUnop(
			this.operator,
			this.operand.build(builder, tofloat),
		)
	}
	protected override type_do(): TYPE.Type {
		const t0: TYPE.Type = this.operand.type();
		return (
			(this.operator === Operator.NOT) ? (
				(t0.isSubtypeOf(TYPE.Type.VOID.union(TYPE.Type.NULL).union(OBJ.SolidBoolean.FALSETYPE))) ? OBJ.SolidBoolean.TRUETYPE :
				(TYPE.Type.VOID.isSubtypeOf(t0) || TYPE.Type.NULL.isSubtypeOf(t0) || OBJ.SolidBoolean.FALSETYPE.isSubtypeOf(t0)) ? TYPE.Type.BOOL :
				OBJ.SolidBoolean.FALSETYPE
			) :
			(this.operator === Operator.EMP) ? TYPE.Type.BOOL :
			/* (this.operator === Operator.NEG) */ (t0.isSubtypeOf(TYPE.Type.INT.union(TYPE.Type.FLOAT)))
				? t0
				: (() => { throw new TypeError01(this); })()
		);
	}
	protected override fold_do(): OBJ.Object | null {
		const v0: OBJ.Object | null = this.operand.fold();
		if (!v0) {
			return v0;
		}
		return (
			(this.operator === Operator.NOT) ? OBJ.SolidBoolean.fromBoolean(!v0.isTruthy) :
			(this.operator === Operator.EMP) ? OBJ.SolidBoolean.fromBoolean(!v0.isTruthy || v0.isEmpty) :
			(this.operator === Operator.NEG) ? this.foldNumeric(v0 as OBJ.SolidNumber<any>) :
			(() => { throw new ReferenceError(`Operator ${ Operator[this.operator] } not found.`) })()
		)
	}
	private foldNumeric<T extends OBJ.SolidNumber<T>>(z: T): T {
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
