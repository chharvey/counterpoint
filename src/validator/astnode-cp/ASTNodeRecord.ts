import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	INST,
	Builder,
	AssignmentError02,
} from '../../index.js';
import type {NonemptyArray} from '../../lib/index.js';
import {
	CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeFamily} from '../utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeKey} from './ASTNodeKey.js';
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
		start_node: SyntaxNodeFamily<'record_literal', ['variable']>,
		public override readonly children: Readonly<NonemptyArray<ASTNodeProperty>>,
		private readonly isRef: boolean,
	) {
		super(start_node, children);
	}

	public override varCheck(): void {
		super.varCheck();
		const keys: ASTNodeKey[] = this.children.map((prop) => prop.key);
		xjs.Array.forEachAggregated(keys.map((key) => key.id), (id, i, ids) => {
			if (ids.slice(0, i).includes(id)) {
				throw new AssignmentError02(keys[i]);
			}
		});
	}

	protected override build_do(builder: Builder): INST.InstructionExpression {
		builder;
		throw 'ASTNodeRecord#build_do not yet supported.';
	}

	protected override type_do(): TYPE.Type {
		return TYPE.TypeRecord.fromTypes(new Map(this.children.map((c) => [
			c.key.id,
			c.val.type(),
		])), true);
	}

	protected override fold_do(): OBJ.Object | null {
		const properties: ReadonlyMap<bigint, OBJ.Object | null> = new Map(this.children.map((c) => [
			c.key.id,
			c.val.fold(),
		]));
		return ([...properties].map((p) => p[1]).includes(null))
			? null
			: !this.isRef
				? new OBJ.Struct(properties as ReadonlyMap<bigint, OBJ.Object>)
				: new OBJ.Record(properties as ReadonlyMap<bigint, OBJ.Object>);
	}

	protected override assignTo_do(assignee: TYPE.Type): boolean {
		if (TYPE.TypeRecord.isUnitType(assignee) || assignee instanceof TYPE.TypeRecord) {
			const assignee_type_record: TYPE.TypeRecord = (TYPE.TypeRecord.isUnitType(assignee))
				? assignee.value.toType()
				: assignee;
			if (this.children.length < assignee_type_record.count[0]) {
				return false;
			}
			try {
				xjs.Array.forEachAggregated([...assignee_type_record.invariants], ([id, thattype]) => {
					const prop: ASTNodeProperty | undefined = this.children.find((p) => p.key.id === id);
					if (!thattype.optional && !prop) {
						throw new TypeError(`Property \`${ id }\` does not exist on type \`${ this.type() }\`.`);
					}
				});
			} catch (err) {
				// TODO: use the caught error as the cause of a new error
				return false;
			}
			xjs.Array.forEachAggregated([...assignee_type_record.invariants], ([id, thattype]) => {
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
