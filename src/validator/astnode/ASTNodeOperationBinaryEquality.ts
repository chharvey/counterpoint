import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	SolidObject,
	SolidBoolean,
	INST,
	Builder,
	Operator,
	ValidOperatorEquality,
	Validator,
} from './package.js';
import {
	bothNumeric,
	oneFloats,
} from './utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';



export class ASTNodeOperationBinaryEquality extends ASTNodeOperationBinary {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryEquality {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryEquality);
		return expression;
	}
	constructor (
		start_node: ParseNode,
		override readonly operator: ValidOperatorEquality,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}
	override shouldFloat(validator: Validator): boolean {
		return this.operator === Operator.EQ && super.shouldFloat(validator);
	}
	protected override build_do(builder: Builder, _to_float: boolean = false): INST.InstructionBinopEquality {
		const tofloat: boolean = builder.config.compilerOptions.intCoercion && this.shouldFloat(builder.validator);
		return new INST.InstructionBinopEquality(
			this.operator,
			this.operand0.build(builder, tofloat),
			this.operand1.build(builder, tofloat),
		)
	}
	protected override type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType {
		/*
		 * If `a` and `b` are of disjoint numeric types, then `a === b` will always return `false`.
		 * If `a` and `b` are of disjoint numeric types, then `a == b` will return `false` when `intCoercion` is off.
		 */
		if (bothNumeric(t0, t1)) {
			if (oneFloats(t0, t1) && (this.operator === Operator.ID || !int_coercion)) {
				return SolidBoolean.FALSETYPE
			}
			return SolidType.BOOL;
		}
		if (t0.intersect(t1).isBottomType) {
			return SolidBoolean.FALSETYPE
		}
		return SolidType.BOOL;
	}
	protected override fold_do(validator: Validator): SolidObject | null {
		const v0: SolidObject | null = this.operand0.fold(validator);
		if (!v0) {
			return v0;
		}
		const v1: SolidObject | null = this.operand1.fold(validator);
		if (!v1) {
			return v1;
		}
		return this.foldEquality(v0, v1);
	}
	private foldEquality(x: SolidObject, y: SolidObject): SolidBoolean {
		return SolidBoolean.fromBoolean(new Map<Operator, (x: SolidObject, y: SolidObject) => boolean>([
			[Operator.ID, (x, y) => x.identical(y)],
			[Operator.EQ, (x, y) => x.equal(y)],
			// [Operator.ISNT, (x, y) => !x.identical(y)],
			// [Operator.NEQ,  (x, y) => !x.equal(y)],
		]).get(this.operator)!(x, y))
	}
}
