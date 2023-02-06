import * as assert from 'assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	TYPE,
	OBJ,
	Builder,
	memoizeMethod,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeTuple extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTuple {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeTuple);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'tuple_literal'>,
		public override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, children);
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): binaryen.ExpressionRef {
		return builder.module.tuple.make(this.children.map((expr) => expr.build(builder)));
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		return TYPE.TypeTuple.fromTypes(this.children.map((c) => c.type()), true);
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const items: readonly (OBJ.Object | null)[] = this.children.map((c) => c.fold());
		return (items.includes(null))
			? null
			: new OBJ.Tuple(items as OBJ.Object[]);
	}

	@ASTNodeCollectionLiteral.assignToDeco
	public override assignTo(assignee: TYPE.Type): boolean {
		if (TYPE.TypeTuple.isUnitType(assignee) || assignee instanceof TYPE.TypeTuple) {
			const assignee_type_tuple: TYPE.TypeTuple = (TYPE.TypeTuple.isUnitType(assignee))
				? assignee.value.toType()
				: assignee;
			if (this.children.length < assignee_type_tuple.count[0]) {
				return false;
			}
			xjs.Array.forEachAggregated(assignee_type_tuple.invariants, (thattype, i) => {
				const expr: ASTNodeExpression | undefined = this.children[i];
				if (expr) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition --- bug
					return ASTNodeCP.typeCheckAssignment(
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
