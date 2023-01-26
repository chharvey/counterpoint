import * as assert from 'assert';
import {
	TypeError01,
	TypeError02,
	TypeError04,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	SolidType,
	SolidTypeIntersection,
	SolidTypeUnion,
	SolidTypeUnit,
	SolidTypeTuple,
	SolidTypeList,
	SolidTypeDict,
	SolidTypeRecord,
	SolidTypeSet,
	SolidTypeMap,
	SolidObject,
	SolidNull,
	Int16,
	CollectionIndexed,
	CollectionKeyed,
	SolidSet,
	SolidMap,
	INST,
	Builder,
	Operator,
	ValidAccessOperator,
} from './package.js';
import {ASTNodeKey} from './ASTNodeKey.js';
import {ASTNodeIndex} from './ASTNodeIndex.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeAccess extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeAccess {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeAccess);
		return expression;
	}
	private readonly optional: boolean = this.kind === Operator.OPTDOT;
	constructor (
		start_node:        PARSENODE.ParseNodeExpressionCompound | PARSENODE.ParseNodeAssignee,
		readonly kind:     ValidAccessOperator,
		readonly base:     ASTNodeExpression,
		readonly accessor: ASTNodeIndex | ASTNodeKey | ASTNodeExpression,
	) {
		super(start_node, {kind}, [base, accessor]);
	}
	override shouldFloat(): boolean {
		throw 'ASTNodeAccess#shouldFloat not yet supported.';
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && '`ASTNodeAccess#build_do` not yet supported.';
	}
	protected override type_do(): SolidType {
		let base_type: SolidType = this.base.type();
		if (base_type instanceof SolidTypeIntersection || base_type instanceof SolidTypeUnion) {
			base_type = base_type.combineTuplesOrRecords();
		}
		return (
			(this.optional && base_type.isSubtypeOf(SolidType.NULL)) ? base_type :
			(this.optional && SolidType.NULL.isSubtypeOf(base_type)) ? this.type_do_do(base_type.subtract(SolidType.NULL)).union(SolidType.NULL) :
			this.type_do_do(base_type)
		);
	}
	private type_do_do(base_type: SolidType): SolidType {
		function updateAccessedDynamicType(type: SolidType, access_kind: ValidAccessOperator): SolidType {
			return (
				(access_kind === Operator.CLAIMDOT) ? type.subtract(SolidType.VOID) :
				(access_kind === Operator.OPTDOT)   ? type.union   (SolidType.NULL) :
				type
			);
		}
		if (this.accessor instanceof ASTNodeIndex) {
			const accessor_type = this.accessor.val.type() as SolidTypeUnit<Int16>;
			if (SolidTypeTuple.isUnitType(base_type) || base_type instanceof SolidTypeTuple) {
				const base_type_tuple: SolidTypeTuple = (SolidTypeTuple.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return base_type_tuple.get(accessor_type.value, this.kind, this.accessor);
			}
			else if (SolidTypeList.isUnitType(base_type) || base_type instanceof SolidTypeList) {
				const base_type_list: SolidTypeList = (SolidTypeList.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return updateAccessedDynamicType(base_type_list.types, this.kind);
			} else {
				throw new TypeError04('index', base_type, this.accessor);
			}
		} else if (this.accessor instanceof ASTNodeKey) {
			if (SolidTypeRecord.isUnitType(base_type) || base_type instanceof SolidTypeRecord) {
				const base_type_record: SolidTypeRecord = (SolidTypeRecord.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return base_type_record.get(this.accessor.id, this.kind, this.accessor);
			} else if (SolidTypeDict.isUnitType(base_type) || base_type instanceof SolidTypeDict) {
				const base_type_dict: SolidTypeDict = (SolidTypeDict.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return updateAccessedDynamicType(base_type_dict.types, this.kind);
			} else {
				throw new TypeError04('property', base_type, this.accessor);
			}
		} else /* (this.accessor instanceof ASTNodeExpression) */ {
			const accessor_type: SolidType = this.accessor.type();
			function throwWrongSubtypeError(accessor: ASTNodeExpression, supertype: SolidType): never {
				throw new TypeError02(accessor_type, supertype, accessor.line_index, accessor.col_index);
			}
			if (SolidTypeTuple.isUnitType(base_type) || base_type instanceof SolidTypeTuple) {
				const base_type_tuple: SolidTypeTuple = (SolidTypeTuple.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return (accessor_type instanceof SolidTypeUnit && accessor_type.value instanceof Int16)
					? base_type_tuple.get(accessor_type.value, this.kind, this.accessor)
					: (accessor_type.isSubtypeOf(SolidType.INT))
						? updateAccessedDynamicType(base_type_tuple.itemTypes(), this.kind)
						: throwWrongSubtypeError(this.accessor, SolidType.INT);
			} else if (SolidTypeList.isUnitType(base_type) || base_type instanceof SolidTypeList) {
				const base_type_list: SolidTypeList = (SolidTypeList.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return (accessor_type.isSubtypeOf(SolidType.INT))
					? updateAccessedDynamicType(base_type_list.types, this.kind)
					: throwWrongSubtypeError(this.accessor, SolidType.INT);
			} else if (SolidTypeSet.isUnitType(base_type) || base_type instanceof SolidTypeSet) {
				const base_type_set: SolidTypeSet = (SolidTypeSet.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return (accessor_type.isSubtypeOf(base_type_set.types))
					? SolidType.BOOL
					: throwWrongSubtypeError(this.accessor, base_type_set.types);
			} else if (SolidTypeMap.isUnitType(base_type) || base_type instanceof SolidTypeMap) {
				const base_type_map: SolidTypeMap = (SolidTypeMap.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return (accessor_type.isSubtypeOf(base_type_map.antecedenttypes))
					? updateAccessedDynamicType(base_type_map.consequenttypes, this.kind)
					: throwWrongSubtypeError(this.accessor, base_type_map.antecedenttypes);
			} else {
				throw new TypeError01(this);
			}
		}
	}
	protected override fold_do(): SolidObject | null {
		const base_value: SolidObject | null = this.base.fold();
		if (base_value === null) {
			return null;
		}
		if (this.optional && base_value.identical(SolidNull.NULL)) {
			return base_value;
		}
		if (this.accessor instanceof ASTNodeIndex) {
			return (base_value as CollectionIndexed).get(this.accessor.val.fold() as Int16, this.optional, this.accessor);
		} else if (this.accessor instanceof ASTNodeKey) {
			return (base_value as CollectionKeyed).get(this.accessor.id, this.optional, this.accessor);
		} else /* (this.accessor instanceof ASTNodeExpression) */ {
			const accessor_value: SolidObject | null = this.accessor.fold();
			if (accessor_value === null) {
				return null;
			}
			return (
				(base_value instanceof CollectionIndexed) ?    (base_value as CollectionIndexed).get(accessor_value as Int16, this.optional, this.accessor) :
				(base_value instanceof SolidSet)          ?    (base_value as SolidSet)         .get(accessor_value                                       ) :
				/* (base_value instanceof SolidMap)       ? */ (base_value as SolidMap)         .get(accessor_value,          this.optional, this.accessor)
			);
		}
	}
}
