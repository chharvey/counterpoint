import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	type Optimizer,
	IR,
	TypeErrorNotAssignable,
} from '../../index.ts';
import {
	type NonemptyArray,
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeCase} from './ASTNodeCase.ts';
import {ASTNodeExpression} from './ASTNodeExpression.ts';
import {
	assignToDeco,
	ASTNodeCollectionLiteral,
} from './ASTNodeCollectionLiteral.ts';



export class ASTNodeMap extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeMap {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeMap);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'map_literal', ['break']>,
		public override readonly children: Readonly<NonemptyArray<ASTNodeCase>>,
	) {
		super(start_node, children);
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		if (this.children.some((c) => c.antecedent.type().isBottomType || c.consequent.type().isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.Map(
			TYPE.Union.all(this.children.map((c) => c.antecedent.type())),
			TYPE.Union.all(this.children.map((c) => c.consequent.type())),
			true,
		);
	}

	@memoizeMethod
	public override lower(optimizer: Optimizer): IR.MapNew {
		return new IR.MapNew(new Map(this.children.map((c) => [
			c.antecedent.lower(optimizer).asTac(optimizer),
			c.consequent.lower(optimizer).asTac(optimizer),
		])), this.type());
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
		if (assignee instanceof TYPE.Map) {
			// better error reporting to check entry-by-entry instead of checking `this.type().typearg_{ant,con}`
			return xjs.Array.forEachAggregated(this.children, (case_) => (
				xjs.Array.forEachAggregated([case_.antecedent, case_.consequent], (expr, i) => (
					ASTNodeCP.typeCheckAssign(expr, [assignee.typearg_ant, assignee.typearg_con][i], expr)
				))
			));
		}
		throw new TypeErrorNotAssignable(this, assignee);
	}
}
