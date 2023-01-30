import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	TYPE,
	OBJ,
	memoizeMethod,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeSet extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeSet {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeSet);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'set_literal'>,
		public override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, children);
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		return new TYPE.TypeSet(
			TYPE.Type.unionAll(this.children.map((c) => c.type())),
			true,
		);
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const elements: readonly (OBJ.Object | null)[] = this.children.map((c) => c.fold());
		return (elements.includes(null))
			? null
			: new OBJ.Set(new Set(elements as OBJ.Object[]));
	}

	@ASTNodeCollectionLiteral.assignToDeco
	public override assignTo(assignee: TYPE.Type): boolean {
		if (TYPE.TypeSet.isUnitType(assignee) || assignee instanceof TYPE.TypeSet) {
			const assignee_type_set: TYPE.TypeSet = (TYPE.TypeSet.isUnitType(assignee))
				? assignee.value.toType()
				: assignee;
			xjs.Array.forEachAggregated(this.children, (expr) => ASTNodeCP.typeCheckAssignment(
				expr.type(),
				assignee_type_set.invariant,
				expr,
				this.validator,
			));
			return true;
		}
		return false;
	}
}
