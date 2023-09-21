import binaryen from 'binaryen';
import {
	OBJ,
	TYPE,
	type Builder,
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
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';
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
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): binaryen.ExpressionRef {
		const args: readonly [binaryen.ExpressionRef, binaryen.ExpressionRef] = ASTNodeOperation.coerceOperands(builder, this.operand0, this.operand1, () => (
			this.validator.config.compilerOptions.intCoercion && this.operator === Operator.EQ
		));
		const [type0, type1]: binaryen.Type[] = args.map((arg) => binaryen.getExpressionType(arg));
		return (
			(type0 === binaryen.i32 && type1 === binaryen.i32) ? builder.module.i32.eq(...args) : // `ID` and `EQ` give the same result
			(type0 === binaryen.i32 && type1 === binaryen.f64) ? builder.module.call('i_f_id', [...args], binaryen.i32) :
			(type0 === binaryen.f64 && type1 === binaryen.i32) ? builder.module.call('f_i_id', [...args], binaryen.i32) :
			(type0 === binaryen.f64 && type1 === binaryen.f64,   (this.operator === Operator.ID)
				? builder.module.call('fid', [...args], binaryen.i32)
				: builder.module.f64.eq(...args)
			)
		);
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type, int_coercion: boolean): TYPE.Type {
		/*
		 * If `a` and `b` are of disjoint numeric types, then `a === b` will always return `false`.
		 * If `a` and `b` are of disjoint numeric types, then `a == b` will return `false` when `intCoercion` is off.
		 */
		if (bothNumeric(t0, t1)) {
			if (oneFloats(t0, t1) && (this.operator === Operator.ID || !int_coercion)) {
				return OBJ.Boolean.FALSETYPE;
			}
			return TYPE.BOOL;
		}
		if (t0.intersect(t1).isBottomType) {
			return OBJ.Boolean.FALSETYPE;
		}
		return TYPE.BOOL;
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const v0: OBJ.Object | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		const v1: OBJ.Object | null = this.operand1.fold();
		if (!v1) {
			return v1;
		}
		return this.foldEquality(v0, v1);
	}

	private foldEquality(v0: OBJ.Object, v1: OBJ.Object): OBJ.Boolean {
		if (bothNumeric(v0, v1) && oneFloats(v0, v1) && !this.validator.config.compilerOptions.intCoercion) {
			return OBJ.Boolean.FALSE;
		}
		return OBJ.Boolean.fromBoolean(new Map<Operator, (x: OBJ.Object, y: OBJ.Object) => boolean>([
			[Operator.ID, (x, y) => x.identical(y)],
			[Operator.EQ, (x, y) => x.equal(y)],
			// [Operator.ISNT, (x, y) => !x.identical(y)],
			// [Operator.NEQ,  (x, y) => !x.equal(y)],
		]).get(this.operator)!(v0, v1));
	}
}
