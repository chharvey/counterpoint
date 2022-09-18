import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	memoizeMethod,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeSet extends ASTNodeCollectionLiteral {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeSet {
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
	override shouldFloat(): boolean {
		throw 'ASTNodeSet#shouldFloat not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.buildDeco
	override build(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeSet#build_do not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(): TYPE.Type {
		return new TYPE.TypeSet(((this.children.length)
			? TYPE.Type.unionAll(this.children.map((c) => c.type()))
			: TYPE.Type.NEVER
		), true);
	}
	@memoizeMethod
	override fold(): OBJ.Object | null {
		const elements: readonly (OBJ.Object | null)[] = this.children.map((c) => c.fold());
		return (elements.includes(null))
			? null
			: new OBJ.Set(new Set(elements as OBJ.Object[]));
	}

	protected override assignTo_do(assignee: TYPE.Type): boolean {
		if (TYPE.TypeSet.isUnitType(assignee) || assignee instanceof TYPE.TypeSet) {
			const assignee_type_set: TYPE.TypeSet = (TYPE.TypeSet.isUnitType(assignee))
				? assignee.value.toType()
				: assignee;
			xjs.Array.forEachAggregated(this.children, (expr) => ASTNodeCP.typeCheckAssignment(
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
