import * as assert from 'assert';
import {
	SolidType,
	SolidObject,
	INST,
	Builder,
	TypeError03,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	SyntaxNodeFamily,
} from './package.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';




export class ASTNodeClaim extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeClaim {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeClaim);
		return expression;
	}
	private typed_?: SolidType;
	constructor(
		start_node: PARSENODE.ParseNodeExpressionClaim$ | SyntaxNodeFamily<'expression_claim', ['variable']>,
		readonly claimed_type: ASTNodeType,
		readonly operand: ASTNodeExpression,
	) {
		super(start_node, {}, [claimed_type, operand]);
	}
	override shouldFloat(): boolean {
		return this.type().isSubtypeOf(SolidType.FLOAT);
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionExpression {
		const tofloat: boolean = to_float || this.shouldFloat();
		return this.operand.build(builder, tofloat);
	}
	override type(): SolidType { // WARNING: overriding a final method!
		// TODO: use JS decorators for memoizing this method
		if (!this.typed_) {
			this.typed_ = this.type_do();
		};
		return this.typed_;
	}
	protected override type_do(): SolidType {
		const claimed_type:  SolidType = this.claimed_type.eval();
		const computed_type: SolidType = this.operand.type();
		const is_intersection_empty: boolean = claimed_type.intersect(computed_type).equals(SolidType.NEVER);
		const treatIntAsSubtypeOfFloat: boolean = this.validator.config.compilerOptions.intCoercion && (
			   computed_type.isSubtypeOf(SolidType.INT) && SolidType.FLOAT.isSubtypeOf(claimed_type)
			|| claimed_type.isSubtypeOf(SolidType.INT)  && SolidType.FLOAT.isSubtypeOf(computed_type)
			|| SolidType.INT.isSubtypeOf(computed_type) && claimed_type.isSubtypeOf(SolidType.FLOAT)
			|| SolidType.INT.isSubtypeOf(claimed_type)  && computed_type.isSubtypeOf(SolidType.FLOAT)
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
	protected override fold_do(): SolidObject | null {
		return this.operand.fold();
	}
}
