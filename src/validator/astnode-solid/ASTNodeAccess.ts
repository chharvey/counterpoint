import * as assert from 'assert';
import {
	SolidType,
	SolidTypeIntersection,
	SolidTypeUnion,
	SolidTypeUnit,
	SolidTypeTuple,
	SolidTypeList,
	SolidTypeHash,
	SolidTypeRecord,
	SolidTypeSet,
	SolidTypeMap,
	SolidObject,
	SolidNull,
	Int16,
	CollectionIndexed,
	CollectionKeyed,
	SolidTuple,
	SolidRecord,
	SolidList,
	SolidHash,
	SolidSet,
	SolidMap,
	INST,
	Builder,
	TypeError01,
	TypeError02,
	TypeError04,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	SyntaxNodeType,
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
		start_node:
			| PARSENODE.ParseNodeExpressionCompound
			| PARSENODE.ParseNodeAssignee
			| SyntaxNodeType<'expression_compound'>
			| SyntaxNodeType<'assignee'>
		,
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
		throw builder && 'ASTNodeAccess#build_do not yet supported.';
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
			const accessor_type:  SolidTypeUnit = this.accessor.val.type() as SolidTypeUnit;
			const accessor_value: Int16         = accessor_type.value as Int16;
			if (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidTuple || base_type instanceof SolidTypeTuple) {
				const base_type_tuple: SolidTypeTuple = (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidTuple)
					? base_type.value.toType()
					: base_type as SolidTypeTuple;
				return base_type_tuple.get(accessor_value, this.kind, this.accessor);
			}
			else if (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidList || base_type instanceof SolidTypeList) {
				const base_type_list: SolidTypeList = (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidList)
					? base_type.value.toType()
					: base_type as SolidTypeList;
				return updateAccessedDynamicType(base_type_list.types, this.kind);
			} else {
				throw new TypeError04('index', base_type, this.accessor);
			}
		} else if (this.accessor instanceof ASTNodeKey) {
			if (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidRecord || base_type instanceof SolidTypeRecord) {
				const base_type_record: SolidTypeRecord = (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidRecord)
					? base_type.value.toType()
					: base_type as SolidTypeRecord;
				return base_type_record.get(this.accessor.id, this.kind, this.accessor);
			} else if (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidHash || base_type instanceof SolidTypeHash) {
				const base_type_hash: SolidTypeHash = (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidHash)
					? base_type.value.toType()
					: base_type as SolidTypeHash;
				return updateAccessedDynamicType(base_type_hash.types, this.kind);
			} else {
				throw new TypeError04('property', base_type, this.accessor);
			}
		} else /* (this.accessor instanceof ASTNodeExpression) */ {
			const accessor_type: SolidType = this.accessor.type();
			function throwWrongSubtypeError(accessor: ASTNodeExpression, supertype: SolidType): never {
				throw new TypeError02(accessor_type, supertype, accessor.line_index, accessor.col_index);
			}
			if (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidTuple || base_type instanceof SolidTypeTuple) {
				const base_type_tuple: SolidTypeTuple = (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidTuple)
					? base_type.value.toType()
					: base_type as SolidTypeTuple;
				return (accessor_type instanceof SolidTypeUnit && accessor_type.value instanceof Int16)
					? base_type_tuple.get(accessor_type.value, this.kind, this.accessor)
					: (accessor_type.isSubtypeOf(SolidType.INT))
						? updateAccessedDynamicType(base_type_tuple.itemTypes(), this.kind)
						: throwWrongSubtypeError(this.accessor, SolidType.INT);
			} else if (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidList || base_type instanceof SolidTypeList) {
				const base_type_list: SolidTypeList = (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidList)
					? base_type.value.toType()
					: base_type as SolidTypeList;
				return (accessor_type.isSubtypeOf(SolidType.INT))
					? updateAccessedDynamicType(base_type_list.types, this.kind)
					: throwWrongSubtypeError(this.accessor, SolidType.INT);
			} else if (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidSet || base_type instanceof SolidTypeSet) {
				const base_type_set: SolidTypeSet = (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidSet)
					? base_type.value.toType()
					: base_type as SolidTypeSet;
				return (accessor_type.isSubtypeOf(base_type_set.types))
					? updateAccessedDynamicType(base_type_set.types, this.kind)
					: throwWrongSubtypeError(this.accessor, base_type_set.types);
			} else if (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidMap || base_type instanceof SolidTypeMap) {
				const base_type_map: SolidTypeMap = (base_type instanceof SolidTypeUnit && base_type.value instanceof SolidMap)
					? base_type.value.toType()
					: base_type as SolidTypeMap;
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
		if (this.optional && base_value.equal(SolidNull.NULL)) {
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
				(base_value instanceof SolidSet)          ?    (base_value as SolidSet)         .get(accessor_value,          this.optional, this.accessor) :
				/* (base_value instanceof SolidMap)       ? */ (base_value as SolidMap)         .get(accessor_value,          this.optional, this.accessor)
			);
		}
	}
}
