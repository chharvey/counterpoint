import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	type INST,
	type Builder,
} from '../../index.js';
import {
	type NonemptyArray,
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
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeMap extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeMap {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeMap);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'map_literal'>,
		public override readonly children: Readonly<NonemptyArray<ASTNodeCase>>,
	) {
		super(start_node, children);
	}

	public override shouldFloat(): boolean {
		throw 'ASTNodeMap#shouldFloat not yet supported.';
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): INST.InstructionExpression {
		builder;
		throw 'ASTNodeMap#build not yet supported.';
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

	@ASTNodeCollectionLiteral.assignToDeco
	public override assignTo(assignee: TYPE.Type): boolean {
		if (TYPE.TypeMap.isUnitType(assignee) || assignee instanceof TYPE.TypeMap) {
			const assignee_type_map: TYPE.TypeMap = (TYPE.TypeMap.isUnitType(assignee))
				? assignee.value.toType()
				: assignee;
			// better error reporting to check entry-by-entry instead of checking `this.type().invariant_{ant,con}`
			xjs.Array.forEachAggregated(this.children, (case_) => xjs.Array.forEachAggregated([case_.antecedent, case_.consequent], (expr, i) => ASTNodeCP.typeCheckAssignment(
				expr.type(),
				[assignee_type_map.invariant_ant, assignee_type_map.invariant_con][i],
				expr,
				this.validator,
			)));
			return true;
		}
		return false;
	}
}
