import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	VALUE,
	TYPE,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNoEntry,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {
	Operator,
	type ValidAccessOperator,
} from '../Operator.ts';
import {ASTNodeIndex} from './ASTNodeIndex.ts';
import {ASTNodeKey} from './ASTNodeKey.ts';
import {
	buildDeco,
	typeDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';



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
			| SyntaxNodeType<'assignee'>,

		private readonly kind:     ValidAccessOperator,
		public  readonly base:     ASTNodeExpression,
		public  readonly accessor: ASTNodeIndex | ASTNodeKey | ASTNodeExpression,
	) {
		super(start_node, {kind}, [base, accessor]);
		this.optional = this.kind === Operator.OPTDOT;
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('`ASTNodeAccess#build_do` not yet supported.');
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
		switch (true) {
			case this.accessor instanceof ASTNodeIndex: {
				return base_type instanceof TYPE.Tuple
					? base_type.get(this.accessor.index, this.kind, this.accessor)
					: assert.fail(new TypeErrorNoEntry('index', base_type, this.accessor));
			}
			case this.accessor instanceof ASTNodeKey: {
				return base_type instanceof TYPE.Record
					? base_type.get(this.accessor.id, this.kind, this.accessor)
					: assert.fail(new TypeErrorNoEntry('property', base_type, this.accessor));
			}
			case this.accessor instanceof ASTNodeExpression: {
				const accessor_type: TYPE.Type = this.accessor.type();
				switch (true) {
					case base_type instanceof TYPE.List: {
						return accessor_type.isSubtypeOf(TYPE.INT)
							? updateAccessedDynamicType(base_type.invariant, this.kind)
							: throwWrongSubtypeError(this.accessor, TYPE.INT);
					}
					case base_type instanceof TYPE.Dict: {
						return accessor_type.isSubtypeOf(TYPE.SYM)
							? updateAccessedDynamicType(base_type.invariant, this.kind)
							: accessor_type.isSubtypeOf(TYPE.STR)
								? assert.fail(new Error('String keys for dict access are not yet supported.'))
								: throwWrongSubtypeError(this.accessor, TYPE.INT); // FIXME: shouldn’t be INT
					}
					case base_type instanceof TYPE.Set: {
						return accessor_type.isSubtypeOf(base_type.invariant)
							? TYPE.BOOL
							: throwWrongSubtypeError(this.accessor, base_type.invariant);
					}
					case base_type instanceof TYPE.Map: {
						return accessor_type.isSubtypeOf(base_type.invariant_ant)
							? updateAccessedDynamicType(base_type.invariant_con, this.kind)
							: throwWrongSubtypeError(this.accessor, base_type.invariant_ant);
					}
					default: {
						throw new TypeErrorInvalidOperation(this);
					}
				}
			}
			default: {
				throw new Error(`Expected ${ this.accessor } to be an index, key, or bracketed expression.`);
			}
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
		switch (true) {
			case this.accessor instanceof ASTNodeIndex: {
				return (base_value as VALUE.Tuple).get(this.accessor.index, this.optional, this.accessor);
			}
			case this.accessor instanceof ASTNodeKey: {
				return (base_value as VALUE.Record).get(this.accessor.id, this.optional, this.accessor);
			}
			case this.accessor instanceof ASTNodeExpression: {
				const accessor_value: VALUE.Value | null = this.accessor.fold();
				if (accessor_value === null) {
					return null;
				}
				/* eslint-disable @typescript-eslint/no-unsafe-return --- type guard inference is not very good here */
				switch (true) {
					case base_value instanceof VALUE.List: {
						return base_value.get(BigInt((accessor_value as VALUE.Integer).toNumber()), this.optional, this.accessor);
					}
					case base_value instanceof VALUE.Dict: {
						return base_value.get((accessor_value as VALUE.Symbol).id, this.optional, this.accessor);
					}
					case base_value instanceof VALUE.Set: {
						return base_value.get(accessor_value);
					}
					case base_value instanceof VALUE.Map: {
						return base_value.get(accessor_value, this.optional, this.accessor);
					}
					default: {
						throw new Error(`Expected ${ base_value } to be a List, Dict, Set, or Map.`);
					}
				}
				/* eslint-enable @typescript-eslint/no-unsafe-return */
			}
			default: {
				throw new Error(`Expected ${ this.accessor } to be an index, key, or bracketed expression.`);
			}
		}
	}
}
