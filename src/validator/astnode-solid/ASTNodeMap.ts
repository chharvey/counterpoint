import * as assert from 'assert';
import {
	NonemptyArray,
	forEachAggregated,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	SolidType,
	SolidTypeMap,
	SolidObject,
	SolidMap,
	INST,
	Builder,
} from './package.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeCase} from './ASTNodeCase.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeMap extends ASTNodeCollectionLiteral {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeMap {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeMap);
		return expression;
	}
	constructor (
		start_node: PARSENODE.ParseNodeMapLiteral,
		override readonly children: Readonly<NonemptyArray<ASTNodeCase>>,
	) {
		super(start_node, {}, children);
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeMap#build_do not yet supported.';
	}
	protected override type_do(): SolidType {
		return new SolidTypeMap(
			SolidType.unionAll(this.children.map((c) => c.antecedent.type())),
			SolidType.unionAll(this.children.map((c) => c.consequent.type())),
			true,
		);
	}
	protected override fold_do(): SolidObject | null {
		const cases: ReadonlyMap<SolidObject | null, SolidObject | null> = new Map(this.children.map((c) => [
			c.antecedent.fold(),
			c.consequent.fold(),
		]));
		return ([...cases].some((c) => c[0] === null || c[1] === null))
			? null
			: new SolidMap(cases as ReadonlyMap<SolidObject, SolidObject>);
	}

	protected override assignTo_do(assignee: SolidType): boolean {
		if (SolidTypeMap.isUnitType(assignee) || assignee instanceof SolidTypeMap) {
			const assignee_type_map: SolidTypeMap = (SolidTypeMap.isUnitType(assignee))
				? assignee.value.toType()
				: assignee;
			forEachAggregated(this.children, (case_) => forEachAggregated([case_.antecedent, case_.consequent], (expr, i) => ASTNodeSolid.typeCheckAssignment(
				expr.type(),
				[assignee_type_map.antecedenttypes, assignee_type_map.consequenttypes][i],
				expr,
				this.validator,
			)));
			return true;
		}
		return false;
	}
}
