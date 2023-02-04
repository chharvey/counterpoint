import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	Builder,
	NonemptyArray,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	Operator,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



/**
 * Known subclasses:
 * - ASNodeOperationUnary
 * - ASNodeOperationBinary
 * - ASNodeOperationTernary
 */
export abstract class ASTNodeOperation extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperation {
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
	protected static coerceOperands(builder: Builder, expr_a: ASTNodeExpression, expr_b: ASTNodeExpression): [binaryen.ExpressionRef, binaryen.ExpressionRef] {
		const type_a: binaryen.Type          = expr_a.type().binType();
		const type_b: binaryen.Type          = expr_b.type().binType();
		let arg_a:    binaryen.ExpressionRef = expr_a.build(builder).buildBin(builder.module);
		let arg_b:    binaryen.ExpressionRef = expr_b.build(builder).buildBin(builder.module);
		if ([type_a, type_b].includes(binaryen.f64)) {
			if (type_a === binaryen.i32) {
				arg_a = builder.module.f64.convert_u.i32(arg_a);
			}
			if (type_b === binaryen.i32) {
				arg_b = builder.module.f64.convert_u.i32(arg_b);
			}
		}
		return [arg_a, arg_b];
	}


	override readonly tagname: string = 'Operation' // TODO remove after refactoring tests using `#serialize`
	constructor(
		start_node: ParseNode,
		operator: Operator,
		override readonly children: Readonly<NonemptyArray<ASTNodeExpression>>,
	) {
		super(start_node, {operator}, children)
	}
}
