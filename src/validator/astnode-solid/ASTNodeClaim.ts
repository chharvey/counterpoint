import * as assert from 'assert';
import {
	SolidType,
	SolidObject,
	INST,
	Builder,
	TypeError03,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
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
		start_node: ParseNode,
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
		if (claimed_type.intersect(computed_type).equals(SolidType.NEVER)) {
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
