import * as assert from 'assert';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeSupertype,
	Operator,
	ValidOperatorEquality,
} from './package.js';
import {
	bothNumeric,
	oneFloats,
} from './utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';



export class ASTNodeOperationBinaryEquality extends ASTNodeOperationBinary {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryEquality {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryEquality);
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

	public override shouldFloat(): boolean {
		return (
			   this.validator.config.compilerOptions.intCoercion
			&& this.operator === Operator.EQ
			&& super.shouldFloat()
		);
	}

	protected override build_do(builder: Builder): INST.InstructionBinopEquality {
		return new INST.InstructionBinopEquality(this.operator, ...this.buildOps(builder));
	}

	protected override type_do_do(t0: TYPE.Type, t1: TYPE.Type, int_coercion: boolean): TYPE.Type {
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

	protected override fold_do(): OBJ.Object | null {
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
		return OBJ.Boolean.fromBoolean(new Map<Operator, (x: OBJ.Object, y: OBJ.Object) => boolean>([
			[Operator.ID, (x, y) => x.identical(y)],
			[Operator.EQ, (x, y) => x.equal(y)],
			// [Operator.ISNT, (x, y) => !x.identical(y)],
			// [Operator.NEQ,  (x, y) => !x.equal(y)],
		]).get(this.operator)!(v0, v1));
	}
}
