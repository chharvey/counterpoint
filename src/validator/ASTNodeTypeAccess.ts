import * as assert from 'assert';
import {
	TypeError04,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSER,
	SolidType,
	SolidTypeIntersection,
	SolidTypeUnion,
	SolidTypeConstant,
	SolidTypeTuple,
	SolidTypeRecord,
	Int16,
	SolidTuple,
	SolidRecord,
} from './package.js';
import {
	Operator,
} from './Operator.js';
import type {ASTNodeKey} from './ASTNodeKey.js';
import {ASTNodeIndexType} from './ASTNodeIndexType.js';
import {ASTNodeType} from './ASTNodeType.js';
import type {Validator} from './Validator.js';



export class ASTNodeTypeAccess extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeAccess {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeAccess);
		return typ;
	}
	constructor (
		start_node: PARSER.ParseNodeTypeCompound,
		readonly base:     ASTNodeType,
		readonly accessor: ASTNodeIndexType | ASTNodeKey,
	) {
		super(start_node, {}, [base, accessor]);
	}
	protected override assess_do(validator: Validator): SolidType {
		let base_type: SolidType = this.base.assess(validator);
		if (base_type instanceof SolidTypeIntersection || base_type instanceof SolidTypeUnion) {
			base_type = base_type.combineTuplesOrRecords();
		}
		if (this.accessor instanceof ASTNodeIndexType) {
			const accessor_type: SolidType = this.accessor.value.assess(validator);
			return (
				(base_type instanceof SolidTypeConstant && base_type.value instanceof SolidTuple) ? (
					(accessor_type instanceof SolidTypeConstant)
						? base_type.value.toType().get(accessor_type.value as Int16, Operator.DOT, this.accessor)
						: base_type.value.toType().itemTypes()
				) :
				(base_type instanceof SolidTypeTuple) ? (
					(accessor_type instanceof SolidTypeConstant)
						? base_type.get(accessor_type.value as Int16, Operator.DOT, this.accessor)
						: base_type.itemTypes()
				) :
				(() => { throw new TypeError04('index', base_type, this.accessor); })()
			);
		} else /* (this.accessor instanceof ASTNodeKey) */ {
			return (
				(base_type instanceof SolidTypeConstant && base_type.value instanceof SolidRecord) ? base_type.value.toType().get(this.accessor.id, Operator.DOT, this.accessor) :
				(base_type instanceof SolidTypeRecord) ? base_type.get(this.accessor.id, Operator.DOT, this.accessor) :
				(() => { throw new TypeError04('property', base_type, this.accessor); })()
			);
		}
	}
}
