import * as assert from 'assert';
import binaryen from 'binaryen';
import {BinVect} from '../../index.js';
import {
	SolidType,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	ValidOperatorBinary,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



/**
 * Known subclasses:
 * - ASNodeOperationBinaryArithmetic
 * - ASNodeOperationBinaryComparative
 * - ASNodeOperationBinaryEquality
 * - ASNodeOperationBinaryLogical
 */
export abstract class ASTNodeOperationBinary extends ASTNodeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinary);
		return expression;
	}

	/**
	 * Return an instruction performing an operation on arguments.
	 * @param mod    the binaryen module
	 * @param op     the operator
	 * @param args   the operands
	 * @param simple a lambda performing the operation after handling unions; takes `args` as an argument
	 * @return       an instruction that performs the operation at runtime
	 * @final
	 */
	protected static operate(
		mod:    binaryen.Module,
		op:     ValidOperatorBinary,
		args:   readonly [binaryen.ExpressionRef, binaryen.ExpressionRef],
		simple: (args: readonly [binaryen.ExpressionRef, binaryen.ExpressionRef]) => binaryen.ExpressionRef,
	): binaryen.ExpressionRef {
		const bintypes: readonly binaryen.Type[] = args.map((arg) => binaryen.getExpressionType(arg));
		if (bintypes[0] === binaryen.v128 && bintypes[1] === binaryen.v128) {
			const arg0 = new BinVect(mod, {int_float: args[0]});
			const arg1 = new BinVect(mod, {int_float: args[1]});

			const ops = {
				int: {
					int:   ASTNodeOperationBinary.operate(mod, op, [arg0.intValue, arg1.intValue],   simple),
					float: ASTNodeOperationBinary.operate(mod, op, [arg0.intValue, arg1.floatValue], simple),
				},
				float: {
					int:   ASTNodeOperationBinary.operate(mod, op, [arg0.floatValue, arg1.intValue],   simple),
					float: ASTNodeOperationBinary.operate(mod, op, [arg0.floatValue, arg1.floatValue], simple),
				},
			} as const;

			return mod.if(
				arg0.isInt,
				mod.if(arg1.isInt, new BinVect(mod, ops.int.int).vect,   new BinVect(mod, ops.int.float).vect),
				mod.if(arg1.isInt, new BinVect(mod, ops.float.int).vect, new BinVect(mod, ops.float.float).vect),
			);
		}
		if (bintypes[0] === binaryen.v128) {
			ASTNodeOperation.expectIntOrFloat(bintypes[1]);

			const arg0 = new BinVect(mod, {int_float: args[0]});

			let op_int:   binaryen.ExpressionRef = ASTNodeOperationBinary.operate(mod, op, [arg0.intValue,   args[1]], simple);
			let op_float: binaryen.ExpressionRef = ASTNodeOperationBinary.operate(mod, op, [arg0.floatValue, args[1]], simple);

			if (binaryen.getExpressionType(op_int) !== binaryen.getExpressionType(op_float)) {
				op_int   = new BinVect(mod, op_int).vect;
				op_float = new BinVect(mod, op_float).vect;
			}

			return mod.if(arg0.isInt, op_int, op_float);
		}
		if (bintypes[1] === binaryen.v128) {
			ASTNodeOperation.expectIntOrFloat(bintypes[0]);

			const arg1 = new BinVect(mod, {int_float: args[1]});

			let op_int:   binaryen.ExpressionRef = ASTNodeOperationBinary.operate(mod, op, [args[0], arg1.intValue],   simple);
			let op_float: binaryen.ExpressionRef = ASTNodeOperationBinary.operate(mod, op, [args[0], arg1.floatValue], simple);

			if (binaryen.getExpressionType(op_int) !== binaryen.getExpressionType(op_float)) {
				op_int   = new BinVect(mod, op_int).vect;
				op_float = new BinVect(mod, op_float).vect;
			}

			return mod.if(arg1.isInt, op_int, op_float);
		} else {
			return simple.call(null, args);
		}
	}


	constructor(
		start_node: ParseNode,
		readonly operator: ValidOperatorBinary,
		readonly operand0: ASTNodeExpression,
		readonly operand1: ASTNodeExpression,
	) {
		super(start_node, operator, [operand0, operand1]);
	}
	/**
	 * @final
	 */
	protected override type_do(): SolidType {
		return this.type_do_do(
			this.operand0.type(),
			this.operand1.type(),
			this.validator.config.compilerOptions.intCoercion,
		)
	}
	protected abstract type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType;
}
