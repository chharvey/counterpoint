import * as assert from 'node:assert';
import {
	type Builder,
	OP,
} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {
	type EntryType,
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import type {
	SyntaxNodeType,
	SyntaxNodeFamily,
} from '../../utils-private.ts';
import {
	Operator,
	type ValidAccessOperator,
} from '../../Operator.ts';
import {
	get_entry_info,
	validate_access_kind,
	update_accessed_type,
} from '../utils-private.ts';
import {Index} from '../Index-.ts';
import {Key} from '../Key.ts';
import {Expression} from './Expression.ts';
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
	public override type(): TYPE.Type {
		if (this.base.type().isBottomType) {
			return TYPE.NOTHING;
		}
		const entry: EntryType = get_entry_info(this.base.type(), this);
		validate_access_kind(this.kind, entry.optional, this);
		return update_accessed_type(entry.type, this.kind);
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Value {
		const typ:        TYPE.Type   = this.type();
		const base_value: OP.ValueTac = this.base.build(builder).asTac(builder);

		const non_nullish_base = (): OP.Value => {
			switch (true) {
				case this.accessor instanceof Index: {
					if (base_value.type instanceof TYPE.Tuple) {
						/*
						 * Ensure a canonical index. It may be within the mathematical range *[0, count - 1]*.
						 * We cannot assume that this index is validated by the type-checker,
						 * since the actual type of the base may be narrower than its declared type.
						 * E.g.:
						 * ```
						 * val tuple: (int, ?: float) = (42,);
						 * tuple?.1;
						 * ```
						 * The accessor is valid, but we want to make sure
						 * we don’t accidentally try to get the value there at runtime.
						 * If the index is out of range, drop the base and return null.
						 * We can assert there are no optional entries since this tuple type was created by the AST expression (`TYPE.Tuple.fromTypes`).
						 */
						if (base_value.type.isIndexCanonical(this.accessor.index)) {
							return new OP.TupleGet(base_value, this.accessor.index, typ);
						} else {
							builder.pushInstruction(new OP.Drop(base_value));
							return new OP.Const(VALUE.NULL);
						}
					}
					break;
				}
				case this.accessor instanceof Key: {
					if (base_value.type instanceof TYPE.Record) {
						/*
						 * Ensure a canonical key. It must have been added to the value’s type.
						 * We cannot assume that this key is validated by the type-checker,
						 * since the actual type of the base may be narrower than its declared type.
						 * E.g.:
						 * ```
						 * val record: (a: int, b?: float) = (a= 42);
						 * record?.b;
						 * ```
						 * The accessor is valid, but we want to make sure
						 * we don’t accidentally try to get the value there at runtime.
						 * If the key is not canonical, drop the base and return null.
						 * We can assert there are no optional entries since this record type was created by the AST expression (`TYPE.Record.fromTypes`).
						 *
						 * Note: Key hashing will be taken care of in the codegen phase.
						 */
						if (base_value.type.isKeyCanonical(this.accessor.id)) {
							return new OP.RecordGet(base_value, {keyid: this.accessor.id, keysrc: this.accessor.source}, typ);
						} else {
							builder.pushInstruction(new OP.Drop(base_value));
							return new OP.Const(VALUE.NULL);
						}
					}
					break;
				}
				default: {
					assert_instanceof(this.accessor, Expression);
					const base_typename: OP.TypeName = OP.ast_type_name(base_value.type);
					if ([OP.TypeName.LIST, OP.TypeName.DICT, OP.TypeName.SET, OP.TypeName.MAP].includes(base_typename)) {
						return new OP.CollectionDynamicGet(
							base_typename as OP.CollectionDynamicName,
							base_value,
							this.accessor.build(builder).asTac(builder),
							typ,
						);
					}
				}
			}
			// else, it was a union with null (the only other valid option)
			return new OP.Const(VALUE.NULL);
		};

		if (this.kind === Operator.DOT_MAY) {
			return OP.conditional_expression(
				builder,
				this.type(),
				() => new OP.Unop(OP.OpCode.ISNULL, base_value, TYPE.BOOL),
				() => new OP.Const(VALUE.NULL),
				non_nullish_base,
			);
		}
		return non_nullish_base();
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
