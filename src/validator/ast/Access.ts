import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {
	type EntryType,
	VALUE,
	TYPE,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {
	SyntaxNodeType,
	SyntaxNodeFamily,
} from '../utils-private.ts';
import {
	Operator,
	type ValidAccessOperator,
} from '../Operator.ts';
import {
	get_entry_info,
	validate_access_kind,
	update_accessed_type,
} from './utils-private.ts';
import {Index} from './Index-.ts';
import {Key} from './Key.ts';
import {
	buildDeco,
	typeDeco,
	Expression,
} from './Expression.ts';
import type {Reassignable} from './Reassignable.ts';



export class Access extends Expression implements Reassignable {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Access {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Access);
		return expression;
	}

	public constructor(
		start_node:
			| SyntaxNodeType<'expression_compound'>
			| SyntaxNodeFamily<'assignee', ['break']>,

		public readonly kind:     ValidAccessOperator,
		public readonly base:     Expression,
		public readonly accessor: Index | Key | Expression,
	) {
		super(start_node, {kind}, [base, accessor]);
		if ([Operator.DOT_RES].includes(this.kind)) {
			throw new TypeError(`Operator ${ this.kind } not yet supported.`);
		}
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		const base_type: TYPE.Type = this.base.type();
		const base_build: binaryen.ExpressionRef = this.base.build();
		if (this.accessor instanceof Index) {
			assert_instanceof(base_type, TYPE.Tuple);
			const index: bigint | undefined = base_type.canonicalizeIndex(this.accessor.index);
			return index || index === 0n
				? this.builder.module.struct.get(Number(index), base_build, binaryen.getExpressionType(base_build))
				: this.builder.module.unreachable();
		} else if (this.accessor instanceof Key) {
			assert_instanceof(base_type, TYPE.Record);
			const index: bigint | undefined = base_type.canonicalizeKey(this.accessor.id);
			return index || index === 0n
				? this.builder.module.struct.get(Number(index), base_build, binaryen.getExpressionType(base_build))
				: this.builder.module.unreachable();
		} else {
			assert_instanceof(this.accessor, Expression);
			this.accessor.build();
			throw new Error('`Access#build` of a list/dict/set/map is not yet supported.');
		}
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		const entry: EntryType = get_entry_info(this.base.type(), this);
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
			case this.accessor instanceof Index: {
				assert_instanceof(base_value, VALUE.Tuple);
				return base_value.get(this.accessor.index, KIND_MAYBE, this.accessor);
			}
			case this.accessor instanceof Key: {
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
						return base_value.get((accessor_value as VALUE.Integer | VALUE.Natural).toBigInt(), KIND_MAYBE, this.accessor);
					}
					case base_value instanceof VALUE.Dict: {
						return base_value.get((accessor_value as VALUE.Symbol).id, KIND_MAYBE, this.accessor);
					}
					case base_value instanceof VALUE.Set: {
						return base_value.get(accessor_value);
					}
					case base_value instanceof VALUE.Map: {
						return base_value.get(accessor_value);
					}
					default: {
						assert.fail(`Expected ${ base_value } to have a \`get\` method.`);
					}
				}
				/* eslint-enable @typescript-eslint/no-unsafe-return */
			}
		}
	}

	/**
	 * @inheritdoc
	 * @implements Reassignable
	 */
	@memoizeMethod
	public writeType(): TYPE.Type {
		this.type(); // re-assert any assumptions and re-throw any errors
		return get_entry_info(this.base.type(), this, true).type;
	}
}
