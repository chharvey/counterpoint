import * as assert from 'assert';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	TypeError03,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';




export class ASTNodeClaim extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeClaim {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeClaim);
		return expression;
	}

	private typed_?: TYPE.Type;
	public constructor(
		start_node: SyntaxNodeType<'expression_claim'>,
		private readonly claimed_type: ASTNodeType,
		private readonly operand: ASTNodeExpression,
	) {
		super(start_node, {}, [claimed_type, operand]);
	}

	protected override build_do(builder: Builder): INST.InstructionExpression {
		return this.operand.build(builder);
	}

	public override type(): TYPE.Type { // WARNING: overriding a final method!
		// TODO: use JS decorators for memoizing this method
		if (!this.typed_) {
			this.typed_ = this.type_do();
		}
		return this.typed_;
	}

	protected override type_do(): TYPE.Type {
		const claimed_type:  TYPE.Type = this.claimed_type.eval();
		const computed_type: TYPE.Type = this.operand.type();
		const is_intersection_empty:         boolean = claimed_type.intersect(computed_type).isBottomType;
		const is_computed_empty:             boolean = computed_type.isBottomType;
		const treat_int_as_subtype_of_float: boolean = this.validator.config.compilerOptions.intCoercion && (
			   computed_type.isSubtypeOf(TYPE.INT) && TYPE.FLOAT.isSubtypeOf(claimed_type)
			|| claimed_type .isSubtypeOf(TYPE.INT) && TYPE.FLOAT.isSubtypeOf(computed_type)
			|| TYPE.INT.isSubtypeOf(computed_type) && claimed_type .isSubtypeOf(TYPE.FLOAT)
			|| TYPE.INT.isSubtypeOf(claimed_type)  && computed_type.isSubtypeOf(TYPE.FLOAT)
		);
		if (is_intersection_empty && !is_computed_empty && !treat_int_as_subtype_of_float) {
			/*
				`Conversion of type \`${ computed_type }\` to type \`${ claimed_type }\` may be a mistake
				because neither type sufficiently overlaps with the other.
				If this was intentional, convert the expression to \`obj\` first.`;
			*/
			throw new TypeError03(claimed_type, computed_type, this);
		}
		return claimed_type;
	}

	protected override fold_do(): OBJ.Object | null {
		return this.operand.fold();
	}
}
