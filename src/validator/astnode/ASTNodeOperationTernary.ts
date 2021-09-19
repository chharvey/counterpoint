import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	memoizeMethod,
} from '../../decorators.js';
import {
	TypeError01,
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	SolidTypeConstant,
	SolidObject,
	SolidBoolean,
	INST,
	Builder,
	Operator,
	Validator,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



export class ASTNodeOperationTernary extends ASTNodeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationTernary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationTernary);
		return expression;
	}
	constructor(
		start_node: ParseNode,
		readonly operator: Operator.COND,
		readonly operand0: ASTNodeExpression,
		readonly operand1: ASTNodeExpression,
		readonly operand2: ASTNodeExpression,
	) {
		super(start_node, operator, [operand0, operand1, operand2]);
	}
	override shouldFloat(validator: Validator): boolean {
		return this.operand1.shouldFloat(validator) || this.operand2.shouldFloat(validator);
	}
	@memoizeMethod
	@ASTNodeExpression.buildDeco
	override build(builder: Builder, to_float: boolean = false): INST.InstructionConst | INST.InstructionCond {
		const tofloat: boolean = to_float || this.shouldFloat(builder.validator);
		return new INST.InstructionCond(
			this.operand0.build(builder, false),
			this.operand1.build(builder, tofloat),
			this.operand2.build(builder, tofloat),
		)
	}
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(validator: Validator): SolidType {
		const t0: SolidType = this.operand0.type(validator);
		const t1: SolidType = this.operand1.type(validator);
		const t2: SolidType = this.operand2.type(validator);
		return (t0.isSubtypeOf(SolidBoolean))
			? (t0 instanceof SolidTypeConstant)
				? (t0.value === SolidBoolean.FALSE)
					? t2 // If `a` is of type `false`, then `typeof (if a then b else c)` is `typeof c`.
					: t1 // If `a` is of type `true`,  then `typeof (if a then b else c)` is `typeof b`.
				: t1.union(t2)
			: (() => { throw new TypeError01(this) })()
	}
	@memoizeMethod
	override assess(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.operand0.assess(validator);
		if (!assess0) {
			return assess0
		}
		return (assess0 === SolidBoolean.TRUE)
			? this.operand1.assess(validator)
			: this.operand2.assess(validator);
	}
}
