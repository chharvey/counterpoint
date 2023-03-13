import * as assert from 'assert';
import {
	SolidType,
	SolidTypeSet,
	SolidObject,
	SolidSet,
	INST,
	Builder,
	forEachAggregated,
	SolidConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeSet extends ASTNodeCollectionLiteral {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeSet {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeSet);
		return expression;
	}
	constructor (
		start_node: SyntaxNodeType<'set_literal'>,
		override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, children);
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeSet#build_do not yet supported.';
	}
	protected override type_do(): SolidType {
		return new SolidTypeSet(((this.children.length)
			? SolidType.unionAll(this.children.map((c) => c.type()))
			: SolidType.NEVER
		), true);
	}
	protected override fold_do(): SolidObject | null {
		const elements: readonly (SolidObject | null)[] = this.children.map((c) => c.fold());
		return (elements.includes(null))
			? null
			: new SolidSet(new Set(elements as SolidObject[]));
	}

	protected override assignTo_do(assignee: SolidType): boolean {
		if (SolidTypeSet.isUnitType(assignee) || assignee instanceof SolidTypeSet) {
			const assignee_type_set: SolidTypeSet = (SolidTypeSet.isUnitType(assignee))
				? assignee.value.toType()
				: assignee;
			forEachAggregated(this.children, (expr) => ASTNodeSolid.typeCheckAssignment(
				expr.type(),
				assignee_type_set.types,
				expr,
				this.validator,
			));
			return true;
		}
		return false;
	}
}
