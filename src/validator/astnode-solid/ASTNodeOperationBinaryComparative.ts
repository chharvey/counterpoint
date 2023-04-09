import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	SolidType,
	SolidObject,
	SolidBoolean,
	SolidNumber,
	Int16,
	Builder,
	TypeError01,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	Operator,
	ValidOperatorComparative,
} from './package.js';
import {
	bothNumeric,
	bothFloats,
	neitherFloats,
} from './utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';



export class ASTNodeOperationBinaryComparative extends ASTNodeOperationBinary {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryComparative {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryComparative);
		return expression;
	}
	constructor (
		start_node: ParseNode,
		override readonly operator: ValidOperatorComparative,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
		if ([Operator.IS, Operator.ISNT].includes(this.operator)) {
			throw new TypeError(`Operator ${ this.operator } not yet supported.`);
		}
	}

	protected override build_do(builder: Builder): binaryen.ExpressionRef {
		return this.operate(
			builder.module,
			[this.operand0.type(),         this.operand1.type()],
			[this.operand0.build(builder), this.operand1.build(builder)],
		);
	}

	protected override type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType {
		if (bothNumeric(t0, t1) && (int_coercion || (
			bothFloats(t0, t1) || neitherFloats(t0, t1)
		))) {
			return SolidType.BOOL;
		}
		throw new TypeError01(this)
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
		return (v0 instanceof Int16 && v1 instanceof Int16)
			? this.foldComparative(v0, v1)
			: this.foldComparative(
				(v0 as SolidNumber).toFloat(),
				(v1 as SolidNumber).toFloat(),
			);
	}
	private foldComparative<T extends SolidNumber<T>>(x: T, y: T): SolidBoolean {
		return SolidBoolean.fromBoolean(new Map<Operator, (x: T, y: T) => boolean>([
			[Operator.LT, (x, y) => x.lt(y)],
			[Operator.GT, (x, y) => y.lt(x)],
			[Operator.LE, (x, y) => x.equal(y) || x.lt(y)],
			[Operator.GE, (x, y) => x.equal(y) || y.lt(x)],
			// [Operator.NLT, (x, y) => !x.lt(y)],
			// [Operator.NGT, (x, y) => !y.lt(x)],
		]).get(this.operator)!(x, y))
	}

	protected override operateSimple(
		mod:  binaryen.Module,
		args: readonly [binaryen.ExpressionRef, binaryen.ExpressionRef],
	): binaryen.ExpressionRef {
		args = ASTNodeOperation.coerceOperands(mod, ...args);
		const opname = new Map<Operator, 'lt' | 'gt' | 'le' | 'ge'>([
			[Operator.LT, 'lt'],
			[Operator.GT, 'gt'],
			[Operator.LE, 'le'],
			[Operator.GE, 'ge'],
		]).get(this.operator)!;
		return ((!args.map((arg) => binaryen.getExpressionType(arg)).includes(binaryen.f64))
			? mod.i32[`${ opname }_s`]
			: mod.f64[opname])(...args);
	}
}
