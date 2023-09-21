import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	type TypeErrorNotAssignable,
} from '../../index.js';
import {
	type NonemptyArray,
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeCase} from './ASTNodeCase.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteralMutable} from './ASTNodeCollectionLiteralMutable.js';



export class ASTNodeMap extends ASTNodeCollectionLiteralMutable {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeMap {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeMap);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'map_literal'>,
		public override readonly children: Readonly<NonemptyArray<ASTNodeCase>>,
	) {
		super(start_node, children);
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		return new TYPE.TypeMap(
			TYPE.Type.unionAll(this.children.map((c) => c.antecedent.type())),
			TYPE.Type.unionAll(this.children.map((c) => c.consequent.type())),
			true,
		);
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const cases: ReadonlyMap<OBJ.Object | null, OBJ.Object | null> = new Map(this.children.map((c) => [
			c.antecedent.fold(),
			c.consequent.fold(),
		]));
		return ([...cases].some((c) => c[0] === null || c[1] === null))
			? null
			: new OBJ.Map(cases as ReadonlyMap<OBJ.Object, OBJ.Object>);
	}

	@ASTNodeCollectionLiteralMutable.assignToDeco
	public override assignTo(assignee: TYPE.Type, err: TypeErrorNotAssignable): void {
		if (assignee instanceof TYPE.TypeMap) {
			// better error reporting to check entry-by-entry instead of checking `this.type().invariant_{ant,con}`
			return xjs.Array.forEachAggregated(this.children, (case_) => (
				xjs.Array.forEachAggregated([case_.antecedent, case_.consequent], (expr, i) => (
					ASTNodeCP.assignExpression(expr, [assignee.invariant_ant, assignee.invariant_con][i], expr)
				))
			));
		}
		throw err;
	}
}
