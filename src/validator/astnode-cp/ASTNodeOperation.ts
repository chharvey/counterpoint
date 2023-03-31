import * as assert from 'assert';
import binaryen from 'binaryen';
import type {Builder} from '../../index.js';
import {
	type NonemptyArray,
	assert_instanceof,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeSupertype} from '../utils-private.js';
import type {Operator} from '../Operator.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



/**
 * Known subclasses:
 * - ASTNodeOperationUnary
 * - ASTNodeOperationBinary
 * - ASTNodeOperationTernary
 */
export abstract class ASTNodeOperation extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperation {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperation);
		return expression;
	}

	/**
	 * Assert that the given binaryen type is either `i32` or `f64`.
	 * @throws {TypeError} if not
	 */
	public static expectIntOrFloat(bintype: binaryen.Type): void {
		try {
			assert.strictEqual(bintype, binaryen.i32);
		} catch (err) {
			if (err instanceof assert.AssertionError) {
				try {
					assert.strictEqual(bintype, binaryen.f64);
				} catch (er) {
					if (er instanceof assert.AssertionError) {
						throw new TypeError(`Expected \`${ bintype }\` to be \`int\` or \`float\`.`);
					} else {
						throw er;
					}
				}
			} else {
				throw err;
			}
		}
	}

	/**
	 * Coerce either operand from an i32 into an f64 if necessary and possible.
	 * @param expr_a the first operand
	 * @param expr_b the second operand
	 * @param condition a condition that must be met in order for coercion to take place
	 * @return       the pair of operands, built and updated
	 * @throws       if the operands have different types even after the coercion
	 */
	protected static coerceOperands(builder: Builder, expr_a: ASTNodeExpression, expr_b: ASTNodeExpression, condition: () => boolean = () => true): [binaryen.ExpressionRef, binaryen.ExpressionRef] {
		let   [arg_a,  arg_b]:  binaryen.ExpressionRef[] = [expr_a, expr_b] .map((expr) => expr.build(builder));
		const [type_a, type_b]: binaryen.Type[]          = [arg_a,  arg_b]  .map((arg)  => binaryen.getExpressionType(arg));
		if (condition() && [type_a, type_b].includes(binaryen.f64)) {
			if (type_a === binaryen.i32) {
				arg_a = builder.module.f64.convert_u.i32(arg_a);
			}
			if (type_b === binaryen.i32) {
				arg_b = builder.module.f64.convert_u.i32(arg_b);
			}
		}
		return [arg_a, arg_b];
	}


	public override readonly tagname: string = 'Operation'; // TODO remove after refactoring tests using `#serialize`
	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		operator: Operator,
		public override readonly children: Readonly<NonemptyArray<ASTNodeExpression>>,
	) {
		super(start_node, {operator}, children);
	}
}
