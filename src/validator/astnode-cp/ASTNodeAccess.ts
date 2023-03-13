import * as assert from 'assert';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	TypeError01,
	TypeError02,
	TypeError04,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
	Operator,
	ValidAccessOperator,
} from './package.js';
import {ASTNodeKey} from './ASTNodeKey.js';
import {ASTNodeIndex} from './ASTNodeIndex.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeAccess extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeAccess {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeAccess);
		return expression;
	}

	private readonly optional: boolean = this.kind === Operator.OPTDOT;
	public constructor(
		start_node:
			| SyntaxNodeType<'expression_compound'>
			| SyntaxNodeType<'assignee'>
		,
		private readonly kind:     ValidAccessOperator,
		public  readonly base:     ASTNodeExpression,
		private readonly accessor: ASTNodeIndex | ASTNodeKey | ASTNodeExpression,
	) {
		super(start_node, {kind}, [base, accessor]);
	}

	public override shouldFloat(): boolean {
		throw 'ASTNodeAccess#shouldFloat not yet supported.';
	}

	protected override build_do(builder: Builder): INST.InstructionExpression {
		builder;
		throw 'ASTNodeAccess#build_do not yet supported.';
	}

	protected override type_do(): TYPE.Type {
		let base_type: TYPE.Type = this.base.type();
		if (base_type instanceof TYPE.TypeIntersection || base_type instanceof TYPE.TypeUnion) {
			base_type = base_type.combineTuplesOrRecords();
		}
		return (
			(this.optional && base_type.isSubtypeOf(TYPE.NULL)) ? base_type :
			(this.optional && TYPE.NULL.isSubtypeOf(base_type)) ? this.type_do_do(base_type.subtract(TYPE.NULL)).union(TYPE.NULL) :
			this.type_do_do(base_type)
		);
	}

	private type_do_do(base_type: TYPE.Type): TYPE.Type {
		function updateAccessedDynamicType(type: TYPE.Type, access_kind: ValidAccessOperator): TYPE.Type {
			return (
				(access_kind === Operator.CLAIMDOT) ? type.subtract(TYPE.VOID) :
				(access_kind === Operator.OPTDOT)   ? type.union   (TYPE.NULL) :
				type
			);
		}
		function throwWrongSubtypeError(accessor: ASTNodeExpression, supertype: TYPE.Type): never {
			throw new TypeError02(accessor.type(), supertype, accessor.line_index, accessor.col_index);
		}
		if (this.accessor instanceof ASTNodeIndex) {
			const accessor_type = this.accessor.val.type() as TYPE.TypeUnit<OBJ.Integer>;
			if (TYPE.TypeTuple.isUnitType(base_type) || base_type instanceof TYPE.TypeTuple) {
				const base_type_tuple: TYPE.TypeTuple = (TYPE.TypeTuple.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return base_type_tuple.get(accessor_type.value, this.kind, this.accessor);
			} else if (TYPE.TypeList.isUnitType(base_type) || base_type instanceof TYPE.TypeList) {
				const base_type_list: TYPE.TypeList = (TYPE.TypeList.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return updateAccessedDynamicType(base_type_list.types, this.kind);
			} else {
				throw new TypeError04('index', base_type, this.accessor);
			}
		} else if (this.accessor instanceof ASTNodeKey) {
			if (TYPE.TypeRecord.isUnitType(base_type) || base_type instanceof TYPE.TypeRecord) {
				const base_type_record: TYPE.TypeRecord = (TYPE.TypeRecord.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return base_type_record.get(this.accessor.id, this.kind, this.accessor);
			} else if (TYPE.TypeDict.isUnitType(base_type) || base_type instanceof TYPE.TypeDict) {
				const base_type_dict: TYPE.TypeDict = (TYPE.TypeDict.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return updateAccessedDynamicType(base_type_dict.types, this.kind);
			} else {
				throw new TypeError04('property', base_type, this.accessor);
			}
		} else /* (this.accessor instanceof ASTNodeExpression) */ {
			const accessor_type: TYPE.Type = this.accessor.type();
			if (TYPE.TypeTuple.isUnitType(base_type) || base_type instanceof TYPE.TypeTuple) {
				const base_type_tuple: TYPE.TypeTuple = (TYPE.TypeTuple.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return (accessor_type instanceof TYPE.TypeUnit && accessor_type.value instanceof OBJ.Integer)
					? base_type_tuple.get(accessor_type.value, this.kind, this.accessor)
					: (accessor_type.isSubtypeOf(TYPE.INT))
						? updateAccessedDynamicType(base_type_tuple.itemTypes(), this.kind)
						: throwWrongSubtypeError(this.accessor, TYPE.INT);
			} else if (TYPE.TypeList.isUnitType(base_type) || base_type instanceof TYPE.TypeList) {
				const base_type_list: TYPE.TypeList = (TYPE.TypeList.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return (accessor_type.isSubtypeOf(TYPE.INT))
					? updateAccessedDynamicType(base_type_list.types, this.kind)
					: throwWrongSubtypeError(this.accessor, TYPE.INT);
			} else if (TYPE.TypeSet.isUnitType(base_type) || base_type instanceof TYPE.TypeSet) {
				const base_type_set: TYPE.TypeSet = (TYPE.TypeSet.isUnitType(base_type))
					? base_type.value.toType()
					: base_type;
				return (accessor_type.isSubtypeOf(base_type_set.types))
					? TYPE.BOOL
					: throwWrongSubtypeError(this.accessor, base_type_set.types);
			} else if (TYPE.TypeMap.isUnitType(base_type) || base_type instanceof TYPE.TypeMap) {
				const base_type_map: TYPE.TypeMap = (TYPE.TypeMap.isUnitType(base_type))
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

	protected override fold_do(): OBJ.Object | null {
		const base_value: OBJ.Object | null = this.base.fold();
		if (base_value === null) {
			return null;
		}
		if (this.optional && base_value.equal(OBJ.Null.NULL)) {
			return base_value;
		}
		if (this.accessor instanceof ASTNodeIndex) {
			return (base_value as OBJ.CollectionIndexed).get(this.accessor.val.fold() as OBJ.Integer, this.optional, this.accessor);
		} else if (this.accessor instanceof ASTNodeKey) {
			return (base_value as OBJ.CollectionKeyed).get(this.accessor.id, this.optional, this.accessor);
		} else /* (this.accessor instanceof ASTNodeExpression) */ {
			const accessor_value: OBJ.Object | null = this.accessor.fold();
			if (accessor_value === null) {
				return null;
			}
			return (
				(base_value instanceof OBJ.CollectionIndexed) ? (base_value as OBJ.CollectionIndexed).get(accessor_value as OBJ.Integer, this.optional, this.accessor) :
				(base_value instanceof OBJ.Set)               ? (base_value as OBJ.Set)              .get(accessor_value                                             ) :
				(base_value instanceof OBJ.Map,                 (base_value as OBJ.Map)              .get(accessor_value,                this.optional, this.accessor))
			);
		}
	}
}
