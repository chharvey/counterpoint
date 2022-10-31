import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	NonemptyArray,
	memoizeMethod,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeProperty} from './ASTNodeProperty.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeRecord extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeRecord {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeRecord);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'record_literal'>,
		public override readonly children: Readonly<NonemptyArray<ASTNodeProperty>>,
	) {
		super(start_node, children);
	}

	public override shouldFloat(): boolean {
		throw 'ASTNodeRecord#shouldFloat not yet supported.';
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): INST.InstructionExpression {
		builder;
		throw 'ASTNodeRecord#build not yet supported.';
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		return TYPE.TypeRecord.fromTypes(new Map(this.children.map((c) => [
			c.key.id,
			c.val.type(),
		])), true);
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const properties: ReadonlyMap<bigint, OBJ.Object | null> = new Map(this.children.map((c) => [
			c.key.id,
			c.val.fold(),
		]));
		return ([...properties].map((p) => p[1]).includes(null))
			? null
			: new OBJ.Record(properties as ReadonlyMap<bigint, OBJ.Object>);
	}

	@ASTNodeCollectionLiteral.assignToDeco
	public override assignTo(assignee: TYPE.Type): boolean {
		if (TYPE.TypeRecord.isUnitType(assignee) || assignee instanceof TYPE.TypeRecord) {
			const assignee_type_record: TYPE.TypeRecord = (TYPE.TypeRecord.isUnitType(assignee))
				? assignee.value.toType()
				: assignee;
			if (this.children.length < assignee_type_record.count[0]) {
				return false;
			}
			try {
				xjs.Array.forEachAggregated([...assignee_type_record.propertytypes], ([id, thattype]) => {
					const prop: ASTNodeProperty | undefined = this.children.find((p) => p.key.id === id);
					if (!thattype.optional && !prop) {
						throw new TypeError(`Property \`${ id }\` does not exist on type \`${ this.type() }\`.`);
					}
				});
			} catch (err) {
				// TODO: use the caught error as the cause of a new error
				return false;
			}
			xjs.Array.forEachAggregated([...assignee_type_record.propertytypes], ([id, thattype]) => {
				const prop: ASTNodeProperty | undefined = this.children.find((p) => p.key.id === id);
				const expr: ASTNodeExpression | undefined = prop?.val;
				if (expr) {
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
