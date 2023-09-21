import type binaryen from 'binaryen';
import {
	OBJ,
	TYPE,
	type Builder,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNoEntry,
} from '../../index.js';
import {
	throw_expression,
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {
	Operator,
	type ValidAccessOperator,
} from '../Operator.js';
import {ASTNodeKey} from './ASTNodeKey.js';
import {ASTNodeIndex} from './ASTNodeIndex.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeAccess extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeAccess {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeAccess);
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

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): binaryen.ExpressionRef {
		builder;
		throw '`ASTNodeAccess#build_do` not yet supported.';
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		let base_type: TYPE.Type = this.base.type();
		if (base_type instanceof TYPE.TypeIntersection || base_type instanceof TYPE.TypeUnion) {
			base_type = base_type.combineTuplesOrRecords();
		}
		return (
			(this.optional && base_type.isSubtypeOf(TYPE.NULL)) ? base_type                                                    :
			(this.optional && TYPE.NULL.isSubtypeOf(base_type)) ? this.type_do(base_type.subtract(TYPE.NULL)).union(TYPE.NULL) :
			this.type_do(base_type)
		);
	}

	private type_do(base_type: TYPE.Type): TYPE.Type {
		function updateAccessedDynamicType(type: TYPE.Type, access_kind: ValidAccessOperator): TYPE.Type {
			return (
				(access_kind === Operator.CLAIMDOT) ? type.subtract(TYPE.VOID) :
				(access_kind === Operator.OPTDOT)   ? type.union   (TYPE.NULL) :
				type
			);
		}
		function throwWrongSubtypeError(accessor: ASTNodeExpression, supertype: TYPE.Type): never {
			throw new TypeErrorNotNarrow(accessor.type(), supertype, accessor.line_index, accessor.col_index);
		}
		if (this.accessor instanceof ASTNodeIndex) {
			return (
				(base_type instanceof TYPE.TypeTuple) ? base_type.get((this.accessor.val.type() as TYPE.TypeUnit<OBJ.Integer>).value, this.kind, this.accessor) :
				(base_type instanceof TYPE.TypeList)  ? updateAccessedDynamicType(base_type.invariant, this.kind)                                               :
				throw_expression(new TypeErrorNoEntry('index', base_type, this.accessor))
			);
		} else if (this.accessor instanceof ASTNodeKey) {
			return (
				(base_type instanceof TYPE.TypeRecord) ? base_type.get(this.accessor.id, this.kind, this.accessor) :
				(base_type instanceof TYPE.TypeDict)   ? updateAccessedDynamicType(base_type.invariant, this.kind) :
				throw_expression(new TypeErrorNoEntry('property', base_type, this.accessor))
			);
		} else {
			assert_instanceof(this.accessor, ASTNodeExpression);
			const accessor_type: TYPE.Type = this.accessor.type();
			/* eslint-disable indent */
			return (
				(base_type instanceof TYPE.TypeTuple) ? (
					(accessor_type instanceof TYPE.TypeUnit && accessor_type.value instanceof OBJ.Integer) ? base_type.get(accessor_type.value, this.kind, this.accessor) :
					(accessor_type.isSubtypeOf(TYPE.INT))
						? updateAccessedDynamicType(base_type.itemTypes(), this.kind)
						: throwWrongSubtypeError(this.accessor, TYPE.INT)
				) :
				(base_type instanceof TYPE.TypeList) ? (
					(accessor_type.isSubtypeOf(TYPE.INT))
						? updateAccessedDynamicType(base_type.invariant, this.kind)
						: throwWrongSubtypeError(this.accessor, TYPE.INT)
				) :
				(base_type instanceof TYPE.TypeSet) ? (
					(accessor_type.isSubtypeOf(base_type.invariant))
						? TYPE.BOOL
						: throwWrongSubtypeError(this.accessor, base_type.invariant)
				) :
				(base_type instanceof TYPE.TypeMap) ? (
					(accessor_type.isSubtypeOf(base_type.invariant_ant))
						? updateAccessedDynamicType(base_type.invariant_con, this.kind)
						: throwWrongSubtypeError(this.accessor, base_type.invariant_ant)
				) :
				throw_expression(new TypeErrorInvalidOperation(this))
			);
			/* eslint-enable indent */
		}
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
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
		} else {
			assert_instanceof(this.accessor, ASTNodeExpression);
			const accessor_value: OBJ.Object | null = this.accessor.fold();
			if (accessor_value === null) {
				return null;
			}
			return (
				                  (base_value instanceof OBJ.CollectionIndexed) ? base_value.get(accessor_value as OBJ.Integer, this.optional, this.accessor) :
				                  (base_value instanceof OBJ.Set)               ? base_value.get(accessor_value                                             ) :
				(assert_instanceof(base_value,           OBJ.Map),                base_value.get(accessor_value,                this.optional, this.accessor))
			);
		}
	}
}
