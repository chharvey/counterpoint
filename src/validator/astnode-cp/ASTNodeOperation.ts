import * as assert from 'assert';
import binaryen from 'binaryen';
import type {Builder} from '../../index.js';
import type {NonemptyArray} from '../../lib/index.js';
import {
	CPConfig,
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
		assert.ok(expression instanceof ASTNodeOperation);
		return expression;
	}

	/**
	 * Coerce either operand from an i32 into an f64 if necessary and possible.
	 * @param expr_a the first operand
	 * @param expr_b the second operand
	 * @return       the pair of operands, built and updated
	 * @throws       if the operands have different types even after the coercion
	 */
	protected static coerceOperands(builder: Builder, expr_a: ASTNodeExpression, expr_b: ASTNodeExpression, condition: () => boolean = () => true): {
		exprs: [binaryen.ExpressionRef, binaryen.ExpressionRef],
		types: [binaryen.Type,          binaryen.Type],
	} {
		let [type_a, type_b]: binaryen.Type[]          = [expr_a, expr_b].map((expr) => expr.type().binType());
		let [arg_a,  arg_b]:  binaryen.ExpressionRef[] = [expr_a, expr_b].map((expr) => expr.build(builder));
		if (condition() && [type_a, type_b].includes(binaryen.f64)) {
			if (type_a === binaryen.i32) {
				[arg_a, type_a] = [builder.module.f64.convert_u.i32(arg_a), binaryen.f64];
			}
			if (type_b === binaryen.i32) {
				[arg_b, type_b] = [builder.module.f64.convert_u.i32(arg_b), binaryen.f64];
			}
		}
		return {
			exprs: [arg_a,  arg_b],
			types: [type_a, type_b],
		};
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
