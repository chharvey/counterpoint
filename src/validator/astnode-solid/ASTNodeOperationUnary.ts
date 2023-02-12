import * as assert from 'assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs'
import {
	SolidType,
	SolidTypeUnion,
	SolidObject,
	SolidBoolean,
	SolidNumber,
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

	/**
	 * Return an instruction performing the operation on the argument.
	 * @param mod   the binaryen module
	 * @param type_ the compile-time type of the operand
	 * @param arg   the operand
	 * @return      an instruction that performs the operation at runtime
	 */
	private operate(mod: binaryen.Module, type_: SolidType, arg: binaryen.ExpressionRef): binaryen.ExpressionRef {
		const bintype: binaryen.Type = binaryen.getExpressionType(arg);
		assert.strictEqual(bintype, type_.binType());
		if (type_ instanceof SolidTypeUnion) {
			// assert: `arg` is equivalent to a result of `Builder.createBinEither()`
			return Builder.createBinEither(
				mod,
				mod.tuple.extract(arg, 0),
				this.operate(mod, type_.left,  mod.tuple.extract(arg, 1)),
				this.operate(mod, type_.right, mod.tuple.extract(arg, 2)),
			);
		} else {
			ASTNodeOperation.expectIntOrFloat(bintype);
			return (this.operator === Operator.NEG && bintype === binaryen.f64)
				? mod.f64.neg(arg)
				: mod.call(new Map<binaryen.Type, ReadonlyMap<Operator, string>>([
					[binaryen.i32, new Map<Operator, string>([
						[Operator.NOT, 'inot'],
						[Operator.EMP, 'iemp'],
						[Operator.NEG, 'neg'],
					])],
					[binaryen.f64, new Map<Operator, string>([
						[Operator.NOT, 'fnot'],
						[Operator.EMP, 'femp'],
					])],
				]).get(bintype)!.get(this.operator)!, [arg], binaryen.i32);
		}
	}

	protected override build_do(builder: Builder): binaryen.ExpressionRef {
		return this.operate(builder.module, this.operand.type(), this.operand.build(builder));
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
