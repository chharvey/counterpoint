import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	SolidType,
	SolidObject,
	SolidBoolean,
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
import {ASTNodeOperation} from './ASTNodeOperation.js';
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

	protected override build_do(builder: Builder): binaryen.ExpressionRef {
		return this.operate(
			builder.module,
			[this.operand0.type(),         this.operand1.type()],
			[this.operand0.build(builder), this.operand1.build(builder)],
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

	protected override operateSimple(
		mod:  binaryen.Module,
		args: readonly [binaryen.ExpressionRef, binaryen.ExpressionRef],
	): binaryen.ExpressionRef {
		args = ASTNodeOperation.coerceOperands(mod, ...args, () => (
			this.validator.config.compilerOptions.intCoercion && this.operator === Operator.EQ
		));
		const [type0, type1]: readonly binaryen.Type[] = args.map((arg) => binaryen.getExpressionType(arg));
		return (
			(type0 === binaryen.i32 && type1 === binaryen.i32) ? mod.i32.eq(...args) : // `ID` and `EQ` give the same result
			(type0 === binaryen.i32 && type1 === binaryen.f64) ? mod.call('i_f_id', [...args], binaryen.i32) :
			(type0 === binaryen.f64 && type1 === binaryen.i32) ? mod.call('f_i_id', [...args], binaryen.i32) :
			(assert.deepStrictEqual([type0, type1], [binaryen.f64, binaryen.f64]), (this.operator === Operator.ID)
				? mod.call('fid', [...args], binaryen.i32)
				: mod.f64.eq(...args)
			)
		);
	}
}
