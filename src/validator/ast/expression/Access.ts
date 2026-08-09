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
import {TYPE} from '../../../typer/index.ts';
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
	access_type,
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
			| SyntaxNodeFamily<'assignee', ['break', 'return']>,

		public readonly kind:     ValidAccessOperator,
		public readonly base:     Expression,
		public readonly accessor: Index | Key | Expression,
	) {
		super(start_node, {kind}, [base, accessor]);
		if (this.kind === Operator.DOT_RESULT) {
			throw new TypeError(`Operator ${ this.kind } not yet supported.`);
		}
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		const base_type: TYPE.Type = this.base.type();
		if (base_type.isBottomType) {
			return TYPE.NOTHING;
		}
		return access_type(this.kind, base_type, get_entry_info(base_type, this), this);
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Value {
		const typ:        TYPE.Type   = this.type();
		const base_value: OP.ValueTac = this.base.build(builder).asTac(builder);

		if (this.kind === Operator.DOT_MAYBE) {
			assert_instanceof(typ, TYPE.Maybe);
			return OP.conditional_expression(
				builder,
				typ,
				() => new OP.Unop(OP.OpCode.ISNONE, base_value, TYPE.BOOL),
				() => new OP.MaybeNew(typ.typearg),
				() => new OP.MaybeNew(typ.typearg, this.#buildNonMaybeBase(
					builder,
					base_value.type instanceof TYPE.Maybe ? new OP.Unop(OP.OpCode.MAYBE_UNWRAP, base_value, base_value.type.typearg).asTac(builder) : base_value,
					typ.typearg,
				)?.asTac(builder)),
			);
		}
		return this.#buildNonMaybeBase(builder, base_value, typ)!; // if not Maybe access, asserts it will always return a value
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

	#buildNonMaybeBase(builder: Builder, base_val: OP.ValueTac, return_type: TYPE.Type): OP.Value | undefined {
		switch (true) {
			case this.accessor instanceof Index: {
				assert_instanceof(base_val.type, TYPE.Tuple);
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
				 * If the index is out of range, drop the base and return a None.
				 * We can assert there are no optional entries since this tuple type was created by the AST expression (`TYPE.Tuple.fromTypes`).
				 */
				if (base_val.type.isIndexCanonical(this.accessor.index)) {
					return new OP.TupleGet(base_val, this.accessor.index, return_type);
				} else {
					builder.pushInstruction(new OP.Drop(base_val));
					return undefined;
				}
			}
			case this.accessor instanceof Key: {
				assert_instanceof(base_val.type, TYPE.Record);
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
				 * If the key is not canonical, drop the base and return a None.
				 * We can assert there are no optional entries since this record type was created by the AST expression (`TYPE.Record.fromTypes`).
				 *
				 * Note: Key hashing will be taken care of in the codegen phase.
				 */
				if (base_val.type.isKeyCanonical(this.accessor.id)) {
					return new OP.RecordGet(base_val, {keyid: this.accessor.id, keysrc: this.accessor.source}, return_type);
				} else {
					builder.pushInstruction(new OP.Drop(base_val));
					return undefined;
				}
			}
			default: {
				assert_instanceof(this.accessor, Expression);
				const base_typename: OP.TypeName = OP.ast_type_name(base_val.type);
				assert.ok([OP.TypeName.LIST, OP.TypeName.DICT, OP.TypeName.SET, OP.TypeName.MAP].includes(base_typename), 'Expected base to be a List, Dict, Set, or Map.');
				return new OP.CollectionDynamicGet(
					base_typename as OP.CollectionDynamicName,
					base_val,
					this.accessor.build(builder).asTac(builder),
					return_type,
				);
			}
		}
	}
}
