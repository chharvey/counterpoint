import * as assert from 'assert';
import {
	TypeError01,
	TypeError02,
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
	SolidTypeSet,
	SolidTypeMapping,
	SolidObject,
	SolidNull,
	Int16,
	SolidTuple,
	SolidRecord,
	SolidSet,
	SolidMapping,
	INST,
	Builder,
} from './package.js';
import {
	Operator,
	ValidAccessOperator,
} from './Operator.js';
import {ASTNodeKey} from './ASTNodeKey.js';
import {ASTNodeIndex} from './ASTNodeIndex.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import type {Validator} from './Validator.js';



export class ASTNodeAccess extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeAccess {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeAccess);
		return expression;
	}
	private readonly optional: boolean = this.kind === Operator.OPTDOT;
	// private readonly claim:    boolean = this.kind === Operator.CLAIMDOT;
	constructor (
		start_node: PARSER.ParseNodeExpressionCompound,
		readonly kind:     ValidAccessOperator,
		readonly base:     ASTNodeExpression,
		readonly accessor: ASTNodeIndex | ASTNodeKey | ASTNodeExpression,
	) {
		super(start_node, {kind}, [base, accessor]);
	}
	override shouldFloat(_validator: Validator): boolean {
		throw 'ASTNodeAccess#shouldFloat not yet supported.';
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeAccess#build_do not yet supported.';
	}
	protected override type_do(validator: Validator): SolidType {
		let base_type: SolidType = this.base.type(validator);
		if (base_type instanceof SolidTypeIntersection || base_type instanceof SolidTypeUnion) {
			base_type = base_type.combineTuplesOrRecords();
		}
		return (
			(this.optional && base_type.isSubtypeOf(SolidNull)) ? base_type :
			(this.optional && SolidNull.isSubtypeOf(base_type)) ? this.type_do_do(base_type.subtract(SolidNull), validator).union(SolidNull) :
			this.type_do_do(base_type, validator)
		);
	}
	private type_do_do(base_type: SolidType, validator: Validator): SolidType {
		function updateDynamicType(type: SolidType, access_kind: ValidAccessOperator): SolidType {
			return new Map([
				[Operator.OPTDOT,   () => type.union(SolidNull)],
				[Operator.CLAIMDOT, () => type.subtract(SolidType.VOID)],
			]).get(access_kind)?.() || type;
		}
		if (this.accessor instanceof ASTNodeIndex) {
			const accessor_type:  SolidTypeConstant = this.accessor.value.type(validator) as SolidTypeConstant;
			const accessor_value: Int16             = accessor_type.value as Int16;
			return (
				(base_type instanceof SolidTypeConstant && base_type.value instanceof SolidTuple) ? base_type.value.toType().get(accessor_value, this.kind, this.accessor) :
				(base_type instanceof SolidTypeTuple)                                             ? base_type               .get(accessor_value, this.kind, this.accessor) :
				(() => { throw new TypeError04('index', base_type, this.accessor); })()
			);
		} else if (this.accessor instanceof ASTNodeKey) {
			return (
				(base_type instanceof SolidTypeConstant && base_type.value instanceof SolidRecord) ? base_type.value.toType().get(this.accessor.id, this.kind, this.accessor) :
				(base_type instanceof SolidTypeRecord)                                             ? base_type               .get(this.accessor.id, this.kind, this.accessor) :
				(() => { throw new TypeError04('property', base_type, this.accessor); })()
			);
		} else /* (this.accessor instanceof ASTNodeExpression) */ {
			const accessor_type: SolidType = this.accessor.type(validator);
			function throwWrongSubtypeError(accessor: ASTNodeExpression, supertype: SolidType): never {
				throw new TypeError02(accessor_type, supertype, accessor.line_index, accessor.col_index);
			}
			if (base_type instanceof SolidTypeConstant && base_type.value instanceof SolidTuple || base_type instanceof SolidTypeTuple) {
				const base_type_tuple: SolidTypeTuple = (base_type instanceof SolidTypeConstant && base_type.value instanceof SolidTuple)
					? base_type.value.toType()
					: (base_type as SolidTypeTuple);
				return (accessor_type instanceof SolidTypeConstant && accessor_type.value instanceof Int16)
					? base_type_tuple.get(accessor_type.value, this.kind, this.accessor)
					: (accessor_type.isSubtypeOf(Int16))
						? updateDynamicType(base_type_tuple.itemTypes(), this.kind)
						: throwWrongSubtypeError(this.accessor, Int16);
			} else if (base_type instanceof SolidTypeConstant && base_type.value instanceof SolidSet || base_type instanceof SolidTypeSet) {
				const base_type_set: SolidTypeSet = (base_type instanceof SolidTypeConstant && base_type.value instanceof SolidSet)
					? base_type.value.toType()
					: (base_type as SolidTypeSet);
				return (accessor_type.isSubtypeOf(base_type_set.types))
					? updateDynamicType(base_type_set.types, this.kind)
					: throwWrongSubtypeError(this.accessor, base_type_set.types);
			} else if (base_type instanceof SolidTypeConstant && base_type.value instanceof SolidMapping || base_type instanceof SolidTypeMapping) {
				const base_type_mapping: SolidTypeMapping = (base_type instanceof SolidTypeConstant && base_type.value instanceof SolidMapping)
					? base_type.value.toType()
					: (base_type as SolidTypeMapping);
				return (accessor_type.isSubtypeOf(base_type_mapping.antecedenttypes))
					? updateDynamicType(base_type_mapping.consequenttypes, this.kind)
					: throwWrongSubtypeError(this.accessor, base_type_mapping.antecedenttypes);
			} else {
				throw new TypeError01(this);
			}
		}
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const base_value: SolidObject | null = this.base.assess(validator);
		if (base_value === null) {
			return null;
		}
		if (this.optional && base_value.equal(SolidNull.NULL)) {
			return base_value;
		}
		if (this.accessor instanceof ASTNodeIndex) {
			return (base_value as SolidTuple).get(this.accessor.value.assess(validator) as Int16, this.optional, this.accessor);
		} else if (this.accessor instanceof ASTNodeKey) {
			return (base_value as SolidRecord).get(this.accessor.id, this.optional, this.accessor);
		} else /* (this.accessor instanceof ASTNodeExpression) */ {
			const accessor_value: SolidObject | null = this.accessor.assess(validator);
			if (accessor_value === null) {
				return null;
			}
			if (base_value instanceof SolidTuple) {
				return (base_value as SolidTuple).get(accessor_value as Int16, this.optional, this.accessor);
			} else if (base_value instanceof SolidSet) {
				return (base_value as SolidSet).get(accessor_value, this.optional, this.accessor);
			} else /* (base_value instanceof SolidMapping) */ {
				return (base_value as SolidMapping).get(accessor_value, this.optional, this.accessor);
			}
		}
	}
}
