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
import {Punctuator} from '../../parser/index.ts';
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

	private readonly optional: boolean;
	public constructor(
		start_node:
			| SyntaxNodeType<'expression_compound'>
			| SyntaxNodeType<'assignee'>,

		public  readonly kind:     ValidAccessOperator,
		public  readonly base:     ASTNodeExpression,
		public  readonly accessor: ASTNodeIndex | ASTNodeKey | ASTNodeExpression,
	) {
		super(start_node, {kind}, [base, accessor]);
		this.optional = this.kind === Operator.DOT_MAY;
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
		switch (true) {
			case this.accessor instanceof ASTNodeIndex: {
				return base_value instanceof VALUE.Tuple
					? (base_value as VALUE.Tuple).get(this.accessor.index, this.optional, this.accessor)
					: this.#assert_maybe_and_return_null();
			}
			case this.accessor instanceof ASTNodeKey: {
				return base_value instanceof VALUE.Record
					? (base_value as VALUE.Record).get(this.accessor.id, this.optional, this.accessor)
					: this.#assert_maybe_and_return_null();
			}
			default: {
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
						return this.#assert_maybe_and_return_null();
					}
				}
				/* eslint-enable @typescript-eslint/no-unsafe-return */
			}
		}
	}

	#assert_maybe_and_return_null(): VALUE.Null {
		assert.ok(this.optional, `Expected the maybe access operator \`${ Punctuator.DOT_MAY }\`.`);
		return VALUE.NULL;
	}
}
