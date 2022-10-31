import * as assert from 'assert';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	TypeError03,
	memoizeMethod,
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

	public constructor(
		start_node: SyntaxNodeType<'expression_claim'>,
		private readonly claimed_type: ASTNodeType,
		private readonly operand: ASTNodeExpression,
	) {
		super(start_node, {}, [claimed_type, operand]);
	}

	public override shouldFloat(): boolean {
		return this.type().isSubtypeOf(TYPE.FLOAT);
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder, to_float: boolean = false): INST.InstructionExpression {
		const tofloat: boolean = to_float || this.shouldFloat();
		return this.operand.build(builder, tofloat);
	}

	@memoizeMethod
	// Explicitly omitting `@ASTNodeExpression.typeDeco` because we don’t want to include folding logic.
	public override type(): TYPE.Type {
		const claimed_type:  TYPE.Type = this.claimed_type.eval();
		const computed_type: TYPE.Type = this.operand.type();
		const is_intersection_empty: boolean = claimed_type.intersect(computed_type).equals(TYPE.NEVER);
		const treatIntAsSubtypeOfFloat: boolean = this.validator.config.compilerOptions.intCoercion && (
			   computed_type.isSubtypeOf(TYPE.INT) && TYPE.FLOAT.isSubtypeOf(claimed_type)
			|| claimed_type .isSubtypeOf(TYPE.INT) && TYPE.FLOAT.isSubtypeOf(computed_type)
			|| TYPE.INT.isSubtypeOf(computed_type) && claimed_type .isSubtypeOf(TYPE.FLOAT)
			|| TYPE.INT.isSubtypeOf(claimed_type)  && computed_type.isSubtypeOf(TYPE.FLOAT)
		);
		if (is_intersection_empty && !treatIntAsSubtypeOfFloat) {
			/*
				`Conversion of type \`${ computed_type }\` to type \`${ claimed_type }\` may be a mistake
				because neither type sufficiently overlaps with the other. If this was intentional,
				convert the expression to \`obj\` first.`;
			*/
			throw new TypeError03(claimed_type, computed_type, this);
		}
		return claimed_type;
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		return this.operand.fold();
	}
}
