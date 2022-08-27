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
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeClaim {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeClaim);
		return expression;
	}

	private typed_?: TYPE.Type;
	constructor(
		start_node: SyntaxNodeType<'expression_claim'>,
		readonly claimed_type: ASTNodeType,
		readonly operand: ASTNodeExpression,
	) {
		super(start_node, {}, [claimed_type, operand]);
	}

	override shouldFloat(): boolean {
		return this.type().isSubtypeOf(TYPE.Type.FLOAT);
	}

	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionExpression {
		const tofloat: boolean = to_float || this.shouldFloat();
		return this.operand.build(builder, tofloat);
	}

	override type(): TYPE.Type { // WARNING: overriding a final method!
		// TODO: use JS decorators for memoizing this method
		if (!this.typed_) {
			this.typed_ = this.type_do();
		};
		return this.typed_;
	}

	protected override type_do(): TYPE.Type {
		const claimed_type:  TYPE.Type = this.claimed_type.eval();
		const computed_type: TYPE.Type = this.operand.type();
		const is_intersection_empty: boolean = claimed_type.intersect(computed_type).equals(TYPE.Type.NEVER);
		const treatIntAsSubtypeOfFloat: boolean = this.validator.config.compilerOptions.intCoercion && (
			   computed_type.isSubtypeOf(TYPE.Type.INT) && TYPE.Type.FLOAT.isSubtypeOf(claimed_type)
			|| claimed_type .isSubtypeOf(TYPE.Type.INT) && TYPE.Type.FLOAT.isSubtypeOf(computed_type)
			|| TYPE.Type.INT.isSubtypeOf(computed_type) && claimed_type .isSubtypeOf(TYPE.Type.FLOAT)
			|| TYPE.Type.INT.isSubtypeOf(claimed_type)  && computed_type.isSubtypeOf(TYPE.Type.FLOAT)
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

	protected override fold_do(): OBJ.Object | null {
		return this.operand.fold();
	}
}
