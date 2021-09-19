import type {
	ParseNode,
} from '@chharvey/parser';
import * as assert from 'assert';
import * as xjs from 'extrajs'
import {
	memoizeMethod,
} from '../../decorators.js';
import {
	TypeError01,
	NanError01,
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	SolidObject,
	SolidNull,
	SolidBoolean,
	SolidNumber,
	INST,
	Builder,
	Operator,
	ValidOperatorUnary,
	Validator,
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
	override shouldFloat(validator: Validator): boolean {
		return this.operand.shouldFloat(validator);
	}
	@memoizeMethod
	@ASTNodeExpression.buildDeco
	override build(builder: Builder, to_float: boolean = false): INST.InstructionConst | INST.InstructionUnop {
		const tofloat: boolean = to_float || this.shouldFloat(builder.validator);
		return new INST.InstructionUnop(
			this.operator,
			this.operand.build(builder, tofloat),
		)
	}
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(validator: Validator): SolidType {
		const t0: SolidType = this.operand.type(validator);
		return (
			(this.operator === Operator.NOT) ? (
				(t0.isSubtypeOf(SolidType.VOID.union(SolidNull).union(SolidBoolean.FALSETYPE))) ? SolidBoolean.TRUETYPE :
				(SolidType.VOID.isSubtypeOf(t0) || SolidNull.isSubtypeOf(t0) || SolidBoolean.FALSETYPE.isSubtypeOf(t0)) ? SolidBoolean :
				SolidBoolean.FALSETYPE
			) :
			(this.operator === Operator.EMP) ? SolidBoolean :
			/* (this.operator === Operator.NEG) */ (t0.isSubtypeOf(SolidNumber)) ? t0 : (() => { throw new TypeError01(this); })()
		);
	}
	@memoizeMethod
	override assess(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.operand.assess(validator);
		if (!assess0) {
			return assess0
		}
		return (
			(this.operator === Operator.NOT) ? SolidBoolean.fromBoolean(!assess0.isTruthy) :
			(this.operator === Operator.EMP) ? SolidBoolean.fromBoolean(!assess0.isTruthy || assess0.isEmpty) :
			(this.operator === Operator.NEG) ? this.foldNumeric(assess0 as SolidNumber<any>) :
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
