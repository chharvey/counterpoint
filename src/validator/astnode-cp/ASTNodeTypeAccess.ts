import * as assert from 'assert';
import {
	TYPE,
	OBJ,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
	Operator,
} from './package.js';
import type {ASTNodeKey} from './ASTNodeKey.js';
import {ASTNodeIndexType} from './ASTNodeIndexType.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeAccess extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeAccess {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeAccess);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_compound'>,
		private readonly base:     ASTNodeType,
		private readonly accessor: ASTNodeIndexType | ASTNodeKey,
	) {
		super(start_node, {}, [base, accessor]);
	}

	protected override eval_do(): TYPE.Type {
		let base_type: TYPE.Type = this.base.eval();
		if (base_type instanceof TYPE.TypeIntersection || base_type instanceof TYPE.TypeUnion) {
			base_type = base_type.combineTuplesOrRecords();
		}
		if (this.accessor instanceof ASTNodeIndexType) {
			const accessor_type = this.accessor.val.eval() as TYPE.TypeUnit<OBJ.Integer>;
			const base_type_tuple: TYPE.TypeTuple = (TYPE.TypeTuple.isUnitType(base_type))
				? base_type.value.toType()
				: base_type as TYPE.TypeTuple;
			return base_type_tuple.get(accessor_type.value, Operator.DOT, this.accessor);
		} else /* (this.accessor instanceof ASTNodeKey) */ {
			const base_type_record: TYPE.TypeRecord = (TYPE.TypeRecord.isUnitType(base_type))
				? base_type.value.toType()
				: base_type as TYPE.TypeRecord;
			return base_type_record.get(this.accessor.id, Operator.DOT, this.accessor);
		}
	}
}
