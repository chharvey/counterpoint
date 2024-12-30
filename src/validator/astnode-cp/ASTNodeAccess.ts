import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	VALUE,
	TYPE,
	type Local,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNoEntry,
} from '../../index.js';
import {
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
import {
	buildDeco,
	typeDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.js';



export class ASTNodeAccess extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeAccess {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeAccess);
		return expression;
	}

	private readonly optional: boolean;
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
		this.optional = this.kind === Operator.OPTDOT;
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		let base_type: TYPE.Type = this.base.type();
		if (base_type instanceof TYPE.Combinable) {
			base_type = base_type.combineTuplesOrRecords();
		}
		const base_build: binaryen.ExpressionRef = this.base.build();
		if (this.accessor instanceof ASTNodeIndex) {
			// TODO: v0.4.3: `assert_instanceof(base_type, TYPE.TypeTuple);`
			if (base_type instanceof TYPE.Tuple) {
				const flattened_indices: number | number[] = base_type.getFlattenedIndices((this.accessor.val.fold() as VALUE.Integer).toNumber()); // TODO: v0.4.3: use `Number(this.accessor.index)`

				/*
				 * If the index is a single number, return an extract of the build at that index.
				 * If the index array has length 1, return a singleton tuple containing that extract.
				 * If the index array length is > 1, return a tuple of extracts whose first entry is a `tee` and the rest are `get`s.
				 */
				if (typeof flattened_indices === 'number') {
					return this.builder.module.tuple.extract(base_build, flattened_indices);
				} else if (flattened_indices.length === 1) {
					return this.builder.module.tuple.make([
						this.builder.module.tuple.extract(base_build, flattened_indices[0]),
					]);
				} else {
					const local: Local = this.builder.teeLocal(this.builder.varCount, base_build);
					return this.builder.module.tuple.make([
						                                         this.builder.module.tuple.extract(local.tee(), flattened_indices[0]), // eslint-disable-line @stylistic/indent
						...flattened_indices.slice(1).map((n) => this.builder.module.tuple.extract(local.get(), n)),
					]);
				}
			}
			throw '`ASTNodeAccess#build` of a list is not yet supported.';
		} else if (this.accessor instanceof ASTNodeKey) {
			// TODO: v0.4.3: `assert_instanceof(base_type, TYPE.TypeRecord);`
			if (base_type instanceof TYPE.Record) {
				throw '`ASTNodeAccess#build` of a record is not yet supported.';
			}
			throw '`ASTNodeAccess#build` of a dict is not yet supported.';
		} else {
			assert_instanceof(this.accessor, ASTNodeExpression);
			this.accessor.build();
			throw '`ASTNodeAccess#build` of a list/dict/set/map is not yet supported.';
		}
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		let base_type: TYPE.Type = this.base.type();
		if (base_type instanceof TYPE.Combinable) {
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
				(base_type instanceof TYPE.Tuple) ? base_type.get((this.accessor.val.type() as TYPE.Unit<VALUE.Integer>).value, this.kind, this.accessor) :
				(base_type instanceof TYPE.List)  ? updateAccessedDynamicType(base_type.invariant, this.kind) :
				assert.fail(new TypeErrorNoEntry('index', base_type, this.accessor))
			);
		} else if (this.accessor instanceof ASTNodeKey) {
			return (
				(base_type instanceof TYPE.Record) ? base_type.get(this.accessor.id, this.kind, this.accessor) :
				(base_type instanceof TYPE.Dict)   ? updateAccessedDynamicType(base_type.invariant, this.kind) :
				assert.fail(new TypeErrorNoEntry('property', base_type, this.accessor))
			);
		} else {
			assert_instanceof(this.accessor, ASTNodeExpression);
			const accessor_type: TYPE.Type = this.accessor.type();
			/* eslint-disable @stylistic/indent */
			return (
				(base_type instanceof TYPE.Tuple) ? (
					(accessor_type instanceof TYPE.Unit && accessor_type.value instanceof VALUE.Integer) ? base_type.get(accessor_type.value, this.kind, this.accessor) :
					(accessor_type.isSubtypeOf(TYPE.INT))
						? updateAccessedDynamicType(base_type.itemTypes(), this.kind)
						: throwWrongSubtypeError(this.accessor, TYPE.INT)
				) :
				(base_type instanceof TYPE.List) ? (
					(accessor_type.isSubtypeOf(TYPE.INT))
						? updateAccessedDynamicType(base_type.invariant, this.kind)
						: throwWrongSubtypeError(this.accessor, TYPE.INT)
				) :
				(base_type instanceof TYPE.Set) ? (
					(accessor_type.isSubtypeOf(base_type.invariant))
						? TYPE.BOOL
						: throwWrongSubtypeError(this.accessor, base_type.invariant)
				) :
				(base_type instanceof TYPE.Map) ? (
					(accessor_type.isSubtypeOf(base_type.invariant_ant))
						? updateAccessedDynamicType(base_type.invariant_con, this.kind)
						: throwWrongSubtypeError(this.accessor, base_type.invariant_ant)
				) :
				assert.fail(new TypeErrorInvalidOperation(this))
			);
			/* eslint-enable @stylistic/indent */
		}
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const base_value: VALUE.Value | null = this.base.fold();
		if (base_value === null) {
			return null;
		}
		if (this.optional && base_value.identical(VALUE.NULL)) {
			return base_value;
		}
		if (this.accessor instanceof ASTNodeIndex) {
			return (base_value as VALUE.CollectionIndexed).get(this.accessor.val.fold() as VALUE.Integer, this.optional, this.accessor);
		} else if (this.accessor instanceof ASTNodeKey) {
			return (base_value as VALUE.CollectionKeyed).get(this.accessor.id, this.optional, this.accessor);
		} else {
			assert_instanceof(this.accessor, ASTNodeExpression);
			const accessor_value: VALUE.Value | null = this.accessor.fold();
			if (accessor_value === null) {
				return null;
			}
			return (
				base_value instanceof VALUE.CollectionIndexed ? base_value.get(accessor_value as VALUE.Integer, this.optional, this.accessor) :
				base_value instanceof VALUE.Set               ? base_value.get(accessor_value                                               ) :
				(assert_instanceof(base_value, VALUE.Map),      base_value.get(accessor_value,                  this.optional, this.accessor))
			);
		}
	}
}
