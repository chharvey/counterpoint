import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	SolidType,
	SolidTypeIntersection,
	SolidTypeUnion,
	SolidTypeUnit,
	SolidTypeTuple,
	SolidTypeRecord,
	Int16,
	Operator,
} from './package.js';
import type {ASTNodeKey} from './ASTNodeKey.js';
import {ASTNodeIndexType} from './ASTNodeIndexType.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeAccess extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeAccess {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeAccess);
		return typ;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTypeCompound,
		readonly base:     ASTNodeType,
		readonly accessor: ASTNodeIndexType | ASTNodeKey,
	) {
		super(start_node, {}, [base, accessor]);
	}
	protected override eval_do(): SolidType {
		let base_type: SolidType = this.base.eval();
		if (base_type instanceof SolidTypeIntersection || base_type instanceof SolidTypeUnion) {
			base_type = base_type.combineTuplesOrRecords();
		}
		if (this.accessor instanceof ASTNodeIndexType) {
			const accessor_type = this.accessor.val.eval() as SolidTypeUnit<Int16>;
			const base_type_tuple: SolidTypeTuple = (SolidTypeTuple.isUnitType(base_type))
				? base_type.value.toType()
				: base_type as SolidTypeTuple;
			return base_type_tuple.get(accessor_type.value, Operator.DOT, this.accessor);
		} else /* (this.accessor instanceof ASTNodeKey) */ {
			const base_type_record: SolidTypeRecord = (SolidTypeRecord.isUnitType(base_type))
				? base_type.value.toType()
				: base_type as SolidTypeRecord;
			return base_type_record.get(this.accessor.id, Operator.DOT, this.accessor);
		}
	}
}
