import * as assert from 'assert';
import {
	forEachAggregated,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	SolidType,
	SolidTypeTuple,
	SolidObject,
	SolidTuple,
	INST,
	Builder,
} from './package.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeTuple extends ASTNodeCollectionLiteral {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTuple {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeTuple);
		return expression;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTupleLiteral,
		override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, {}, children);
	}

	protected override build_do(builder: Builder): INST.InstructionExpression {
		return new INST.InstructionTupleMake(this.children.map((expr) => expr.build(builder)));
	}

	protected override type_do(): SolidType {
		return SolidTypeTuple.fromTypes(this.children.map((c) => c.type()), true);
	}
	protected override fold_do(): SolidObject | null {
		const items: readonly (SolidObject | null)[] = this.children.map((c) => c.fold());
		return (items.includes(null))
			? null
			: new SolidTuple(items as SolidObject[]);
	}

	protected override assignTo_do(assignee: SolidType): boolean {
		if (SolidTypeTuple.isUnitType(assignee) || assignee instanceof SolidTypeTuple) {
			const assignee_type_tuple: SolidTypeTuple = (SolidTypeTuple.isUnitType(assignee))
				? assignee.value.toType()
				: assignee;
			if (this.children.length < assignee_type_tuple.count[0]) {
				return false;
			}
			forEachAggregated(assignee_type_tuple.types, (thattype, i) => {
				const expr: ASTNodeExpression | undefined = this.children[i];
				if (expr) {
					return ASTNodeSolid.typeCheckAssignment(
						expr.type(),
						thattype.type,
						expr,
						this.validator,
					);
				}
			});
			return true;
		}
		return false;
	}
}
