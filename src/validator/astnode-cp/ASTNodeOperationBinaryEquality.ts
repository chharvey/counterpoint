import binaryen from 'binaryen';
import {
	VALUE,
	TYPE,
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
import {
	Operator,
	type ValidOperatorEquality,
} from '../Operator.js';
import {
	bothNumeric,
	oneFloats,
} from './utils-private.js';
import {
	buildDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';



export class ASTNodeOperationBinaryEquality extends ASTNodeOperationBinary {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryEquality {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationBinaryEquality);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorEquality,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		const [arg0, arg1]: binaryen.ExpressionRef[] = this.children.map((operand) => operand.build());
		if (this.type().equals(TYPE.FALSE)) {
			return this.builder.module.block(null, [
				this.builder.module.drop(arg0),
				this.builder.module.drop(arg1),
				new BinVect(this.builder.module, false).vect,
			], binaryen.v128);
		}
		return this.builder.module.call(new Map<Operator, string>([
			[Operator.ID, 'vid'],
			[Operator.EQ, 'veq'],
		]).get(this.operator)!, [arg0, arg1], binaryen.v128);
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type, int_coercion: boolean): TYPE.Type {
		if (t0.isBottomType || t1.isBottomType) {
			return TYPE.NEVER;
		}
		/*
		 * Identity:
		 *
		 * - If      the types of `a` and `b` are disjoint, then `a === b` will always evaluate to false.
		 * - Else if the types of `a` and `b` intersect,    then `a === b` could evaluate to true.
		 *
		 *
		 * Equality:
		 *
		 * - If any of `a` or `b` is disjoint with the Number type (it cannot contain numbers),
		 * 	then we’ll use the same logic as Identity:
		 * 	- If      the types of `a` and `b` are disjoint, then `a == b` will evaluate to false.
		 * 	- Else if the types of `a` and `b` intersect,    then `a == b` could evaluate to true.
		 *
		 * - Else if both `a` and `b` intersect with the Number type (they both might contain numbers), then:
		 * 	- If the types of `a` and `b` are disjoint,
		 * 		and `intCoercion` is off,
		 * 		and one of the types of `a` or `b` cannot contain a floating zero (0.0 or -0.0),
		 * 		then then `a == b` will evaluate to false.
		 * 	- Else if the types of `a` and `b` intersect,
		 * 		or `intCoercion` is on,
		 * 		or both types of `a` and `b` can contain a floating zero (0.0 or -0.0),
		 * 		then `a == b` could evaluate to true.
		 */
		if (t0.intersect(t1).isBottomType && (
			this.operator === Operator.ID ||
			[t0, t1].some((t) => t.intersect(TYPE.INT.union(TYPE.FLOAT)).isBottomType) ||
			!int_coercion && [t0, t1].some((t) => !t.includes(VALUE.FLOAT_0) && !t.includes(VALUE.FLOAT_N0))
		)) {
			return TYPE.FALSE;
		}
		return TYPE.BOOL;
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const v0: VALUE.Value | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		const v1: VALUE.Value | null = this.operand1.fold();
		if (!v1) {
			return v1;
		}
		return this.foldEquality(v0, v1);
	}

	private foldEquality(v0: VALUE.Value, v1: VALUE.Value): VALUE.Boolean {
		if (bothNumeric(v0, v1) && oneFloats(v0, v1) && !this.validator.config.compilerOptions.intCoercion) {
			return VALUE.FALSE;
		}
		return VALUE.Boolean.fromBoolean(new Map<Operator, (x: VALUE.Value, y: VALUE.Value) => boolean>([
			[Operator.ID, (x, y) => x.identical(y)],
			[Operator.EQ, (x, y) => x.equal(y)],
			// [Operator.ISNT, (x, y) => !x.identical(y)],
			// [Operator.NEQ,  (x, y) => !x.equal(y)],
		]).get(this.operator)!(v0, v1));
	}
}
