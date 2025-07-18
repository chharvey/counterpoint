import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	type TypeEntry,
	VALUE,
	type TYPE,
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
import {
	get_entry_info,
	validate_access_kind,
	update_accessed_type,
} from './utils-private.ts';
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

	public constructor(
		start_node:
			| SyntaxNodeType<'expression_compound'>
			| SyntaxNodeType<'assignee'>,

		public  readonly kind:     ValidAccessOperator,
		public  readonly base:     ASTNodeExpression,
		public  readonly accessor: ASTNodeIndex | ASTNodeKey | ASTNodeExpression,
	) {
		super(start_node, {kind}, [base, accessor]);
		if (this.kind === Operator.DOT_RES) {
			throw new TypeError(`Operator ${ this.kind } not yet supported.`);
		}
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('`ASTNodeAccess#build_do` not yet supported.');
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		const entry: TypeEntry = get_entry_info(this.base.type(), this);
		validate_access_kind(this.kind, entry.optional, this);
		return update_accessed_type(entry.type, this.kind);
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const base_value: VALUE.Value | null = this.base.fold();
		if (base_value === null) {
			return null;
		}
		const KIND_MAYBE: boolean = this.kind === Operator.DOT_MAY;
		if (KIND_MAYBE && base_value.identical(VALUE.NULL)) {
			return VALUE.NULL;
		}
		switch (true) {
			case this.accessor instanceof ASTNodeIndex: {
				assert_instanceof(base_value, VALUE.Tuple);
				return base_value.get(this.accessor.index, KIND_MAYBE, this.accessor);
			}
			case this.accessor instanceof ASTNodeKey: {
				assert_instanceof(base_value, VALUE.Record);
				return base_value.get(this.accessor.id, KIND_MAYBE, this.accessor);
			}
			default: {
				const accessor_value: VALUE.Value | null = this.accessor.fold();
				if (accessor_value === null) {
					return null;
				}
				/* eslint-disable @typescript-eslint/no-unsafe-return --- type guard inference is not very good here */
				switch (true) {
					case base_value instanceof VALUE.List: {
						return base_value.get(BigInt((accessor_value as VALUE.Integer).toNumber()), KIND_MAYBE, this.accessor);
					}
					case base_value instanceof VALUE.Dict: {
						return base_value.get((accessor_value as VALUE.Symbol).id, KIND_MAYBE, this.accessor);
					}
					case base_value instanceof VALUE.Set: {
						return base_value.get(accessor_value);
					}
					case base_value instanceof VALUE.Map: {
						return base_value.get(accessor_value, KIND_MAYBE, this.accessor);
					}
					default: {
						assert.fail(`Expected ${ base_value } to have a \`get\` method.`);
					}
				}
				/* eslint-enable @typescript-eslint/no-unsafe-return */
			}
		}
	}
}
