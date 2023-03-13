import * as assert from 'assert';
import {
	SolidType,
	SolidTypeRecord,
	SolidObject,
	SolidRecord,
	INST,
	Builder,
	NonemptyArray,
	forEachAggregated,
	SolidConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeProperty} from './ASTNodeProperty.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeRecord extends ASTNodeCollectionLiteral {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeRecord {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeRecord);
		return expression;
	}
	constructor (
		start_node: SyntaxNodeType<'record_literal'>,
		override readonly children: Readonly<NonemptyArray<ASTNodeProperty>>,
	) {
		super(start_node, children);
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeRecord#build_do not yet supported.';
	}
	protected override type_do(): SolidType {
		return SolidTypeRecord.fromTypes(new Map(this.children.map((c) => [
			c.key.id,
			c.val.type(),
		])), true);
	}
	protected override fold_do(): SolidObject | null {
		const properties: ReadonlyMap<bigint, SolidObject | null> = new Map(this.children.map((c) => [
			c.key.id,
			c.val.fold(),
		]));
		return ([...properties].map((p) => p[1]).includes(null))
			? null
			: new SolidRecord(properties as ReadonlyMap<bigint, SolidObject>);
	}

	protected override assignTo_do(assignee: SolidType): boolean {
		if (SolidTypeRecord.isUnitType(assignee) || assignee instanceof SolidTypeRecord) {
			const assignee_type_record: SolidTypeRecord = (SolidTypeRecord.isUnitType(assignee))
				? assignee.value.toType()
				: assignee;
			if (this.children.length < assignee_type_record.count[0]) {
				return false;
			}
			try {
				forEachAggregated([...assignee_type_record.propertytypes], ([id, thattype]) => {
					const prop: ASTNodeProperty | undefined = this.children.find((prop) => prop.key.id === id);
					if (!thattype.optional && !prop) {
						throw new TypeError(`Property \`${ id }\` does not exist on type \`${ this.type() }\`.`);
					}
				});
			} catch (err) {
				// TODO: use the caught error as the cause of a new error
				return false;
			}
			forEachAggregated([...assignee_type_record.propertytypes], ([id, thattype]) => {
				const prop: ASTNodeProperty | undefined = this.children.find((prop) => prop.key.id === id);
				const expr: ASTNodeExpression | undefined = prop?.val;
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
