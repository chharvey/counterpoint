import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {
	type EntryType,
	VALUE,
	TYPE,
	type Optimizer,
	IR,
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
import type {Reassignable} from './Reassignable.ts';
import {ASTNodeIndex} from './ASTNodeIndex.ts';
import {ASTNodeKey} from './ASTNodeKey.ts';
import {
	buildDeco,
	typeDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';



export class ASTNodeAccess extends ASTNodeExpression implements Reassignable {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeAccess {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeAccess);
		return expression;
	}

	public constructor(
		start_node:
			| SyntaxNodeType<'expression_compound'>
			| SyntaxNodeType<'assignee'>,

		public readonly kind:     ValidAccessOperator,
		public readonly base:     ASTNodeExpression,
		public readonly accessor: ASTNodeIndex | ASTNodeKey | ASTNodeExpression,
	) {
		super(start_node, {kind}, [base, accessor]);
		if (this.kind === Operator.DOT_RES) {
			throw new TypeError(`Operator ${ this.kind } not yet supported.`);
		}
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		const base_type: TYPE.Type = this.base.type();
		const base_build: binaryen.ExpressionRef = this.base.build();
		if (this.accessor instanceof ASTNodeIndex) {
			assert_instanceof(base_type, TYPE.Tuple);
			const index: bigint | undefined = base_type.canonicalizeIndex(this.accessor.index);
			return index || index === 0n
				? this.builder.module.struct.get(Number(index), base_build, binaryen.getExpressionType(base_build))
				: this.builder.module.unreachable();
		} else if (this.accessor instanceof ASTNodeKey) {
			assert_instanceof(base_type, TYPE.Record);
			const index: bigint | undefined = base_type.canonicalizeKey(this.accessor.id);
			return index || index === 0n
				? this.builder.module.struct.get(Number(index), base_build, binaryen.getExpressionType(base_build))
				: this.builder.module.unreachable();
		} else {
			assert_instanceof(this.accessor, ASTNodeExpression);
			this.accessor.build();
			throw new Error('`ASTNodeAccess#build` of a list/dict/set/map is not yet supported.');
		}
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		if (this.base.type().isBottomType) {
			return TYPE.NEVER;
		}
		const entry: EntryType = get_entry_info(this.base.type(), this);
		validate_access_kind(this.kind, entry.optional, this);
		return update_accessed_type(entry.type, this.kind);
	}

	@memoizeMethod
	public override lower(optimizer: Optimizer): IR.Value {
		const typ:           TYPE.Type   = this.type();
		const base_value:    IR.Value    = this.base.lower(optimizer).asTac(optimizer);
		const base_typename: IR.TypeName = IR.ast_type_name(base_value.type);

		const non_nullish_base = (): IR.Value => {
			switch (true) {
				case this.accessor instanceof ASTNodeIndex: {
					if (base_typename === IR.TypeName.TUPLE) {
						assert_instanceof(base_value.type, TYPE.Tuple);
						/*
						 * Canonicalize the index. It may be within the range `[-count, count - 1]`.
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
						const canon_index: bigint | undefined = base_value.type.canonicalizeIndex(this.accessor.index);
						if (canon_index !== undefined) {
							return new IR.TupleGet(base_value, canon_index, typ);
						} else {
							optimizer.pushInstruction(new IR.Drop(base_value));
							return new IR.Const(VALUE.NULL);
						}
					}
					break;
				}
				case this.accessor instanceof ASTNodeKey: {
					if (base_typename === IR.TypeName.RECORD) {
						assert_instanceof(base_value.type, TYPE.Record);
						/*
						 * Ensure a canonical key.
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
							return new IR.RecordGet(base_value, {keyid: this.accessor.id, keysrc: this.accessor.source}, typ);
						} else {
							optimizer.pushInstruction(new IR.Drop(base_value));
							return new IR.Const(VALUE.NULL);
						}
					}
					break;
				}
				default: {
					assert_instanceof(this.accessor, ASTNodeExpression);
					if ([IR.TypeName.LIST, IR.TypeName.DICT, IR.TypeName.SET, IR.TypeName.MAP].includes(base_typename)) {
						return new IR.CollectionDynamicGet(
							base_typename as IR.CollectionDynamicName,
							base_value,
							this.accessor.lower(optimizer).asTac(optimizer),
							typ,
						);
					}
				}
			}
			// else, it was a union with null (the only other valid option)
			return new IR.Const(VALUE.NULL);
		};

		if (this.kind === Operator.DOT_MAY) {
			return IR.conditional_expression(
				optimizer,
				() => new IR.Unop(IR.OpCode.ISNULL, base_value, TYPE.BOOL),
				() => new IR.Const(VALUE.NULL),
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
