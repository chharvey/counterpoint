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
import {buildDeco} from './decorators.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
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
		/*
		 * If `a` and `b` are of disjoint numeric types, then `a === b` will always return `false`.
		 * If `a` and `b` are of disjoint numeric types, then `a == b` will return `false` when `intCoercion` is off.
		 */
		if (bothNumeric(t0, t1)) {
			if (oneFloats(t0, t1) && (this.operator === Operator.ID || !int_coercion)) {
				return TYPE.FALSE;
			}
			return TYPE.BOOL;
		}
		if (t0.intersect(t1).isBottomType) {
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
