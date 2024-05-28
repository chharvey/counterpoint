import binaryen from 'binaryen';
import {
	type TYPE,
	BinVect,
} from '../../index.js';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeSupertype} from '../utils-private.js';
import type {ValidOperatorBinary} from '../Operator.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



/**
 * Known subclasses:
 * - ASTNodeOperationBinaryArithmetic
 * - ASTNodeOperationBinaryComparative
 * - ASTNodeOperationBinaryEquality
 * - ASTNodeOperationBinaryLogical
 */
export abstract class ASTNodeOperationBinary extends ASTNodeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationBinary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationBinary);
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
				[op_int, op_float] = [op_int, op_float].map((op_) => new BinVect(mod, op_).vect);
			}

			return mod.if(arg0.isInt, op_int, op_float);
		}
		if (bintypes[1] === binaryen.v128) {
			ASTNodeOperation.expectIntOrFloat(bintypes[0]);

			const arg1 = new BinVect(mod, {int_float: args[1]});

			let op_int:   binaryen.ExpressionRef = ASTNodeOperationBinary.operate(mod, op, [args[0], arg1.intValue],   simple);
			let op_float: binaryen.ExpressionRef = ASTNodeOperationBinary.operate(mod, op, [args[0], arg1.floatValue], simple);

			if (binaryen.getExpressionType(op_int) !== binaryen.getExpressionType(op_float)) {
				[op_int, op_float] = [op_int, op_float].map((op_) => new BinVect(mod, op_).vect);
			}

			return mod.if(arg1.isInt, op_int, op_float);
		} else {
			return simple.call(null, args);
		}
	}


	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected readonly operator: ValidOperatorBinary,
		public    readonly operand0: ASTNodeExpression,
		public    readonly operand1: ASTNodeExpression,
	) {
		super(start_node, operator, [operand0, operand1]);
	}

	/**
	 * @final
	 */
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		return this.type_do(
			this.operand0.type(),
			this.operand1.type(),
			this.validator.config.compilerOptions.intCoercion,
		);
	}

	protected abstract type_do(t0: TYPE.Type, t1: TYPE.Type, int_coercion: boolean): TYPE.Type;
}
