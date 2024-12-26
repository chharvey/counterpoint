import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	TypeErrorNotAssignable,
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
import {
	typeDeco,
	assignToDeco,
} from './decorators.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeCase} from './ASTNodeCase.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeMap extends ASTNodeCollectionLiteral {
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
	@typeDeco
	public override type(): TYPE.Type {
		return new TYPE.TypeMap(
			TYPE.TypeUnion.all(this.children.map((c) => c.antecedent.type())),
			TYPE.TypeUnion.all(this.children.map((c) => c.consequent.type())),
			true,
		);
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const cases: ReadonlyMap<VALUE.Value | null, VALUE.Value | null> = new Map(this.children.map((c) => [
			c.antecedent.fold(),
			c.consequent.fold(),
		]));
		return ([...cases].some((c) => c[0] === null || c[1] === null))
			? null
			: new VALUE.Map(cases as ReadonlyMap<VALUE.Value, VALUE.Value>);
	}

	@assignToDeco
	public override assignTo(assignee: TYPE.Type): void {
		if (assignee instanceof TYPE.TypeMap) {
			// better error reporting to check entry-by-entry instead of checking `this.type().invariant_{ant,con}`
			return xjs.Array.forEachAggregated(this.children, (case_) => (
				xjs.Array.forEachAggregated([case_.antecedent, case_.consequent], (expr, i) => (
					ASTNodeCP.typeCheckAssign(expr, [assignee.invariant_ant, assignee.invariant_con][i], expr)
				))
			));
		}
		throw new TypeErrorNotAssignable(this.type(), assignee, this);
	}
}
