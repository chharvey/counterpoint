import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	SolidType,
	SolidObject,
	SolidBoolean,
	INST,
	Builder,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	Operator,
	ValidOperatorEquality,
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
	override shouldFloat(): boolean {
		return (
			   this.validator.config.compilerOptions.intCoercion
			&& this.operator === Operator.EQ
			&& super.shouldFloat()
		);
	}

	protected override build_do(builder: Builder): INST.InstructionBinopEquality {
		return new INST.InstructionBinopEquality(this.operator, ...this.buildOps(builder));
	}
	public build__temp(builder: Builder): binaryen.ExpressionRef {
		const [inst0, inst1]: [INST.InstructionExpression, INST.InstructionExpression] = this.buildOps(builder);
		const [arg0, arg1]: binaryen.ExpressionRef[] = [inst0, inst1].map((inst) => inst.buildBin(builder.module));
		return (
			(!inst0.isFloat && !inst1.isFloat) ? builder.module.i32.eq(arg0, arg1) : // `ID` and `EQ` give the same result
			(!inst0.isFloat &&  inst1.isFloat) ? builder.module.call('i_f_id', [arg0, arg1], binaryen.i32) :
			( inst0.isFloat && !inst1.isFloat) ? builder.module.call('f_i_id', [arg0, arg1], binaryen.i32) :
			( inst0.isFloat &&  inst1.isFloat,   (this.operator === Operator.ID)
				? builder.module.call('fid', [arg0, arg1], binaryen.i32)
				: builder.module.f64.eq(arg0, arg1)
			)
		);
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
	protected override fold_do(): SolidObject | null {
		const v0: SolidObject | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		const v1: SolidObject | null = this.operand1.fold();
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
