import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {
	type EntryType,
	VALUE,
	TYPE,
	type IrLocal,
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
		const entry: EntryType = get_entry_info(this.base.type(), this);
		validate_access_kind(this.kind, entry.optional, this);
		return update_accessed_type(entry.type, this.kind);
	}

	@memoizeMethod
	public override lower(optimizer: Optimizer): IR.Value {
		const typ:        TYPE.Type = this.type();
		const base_type:  TYPE.Type = this.base.type();
		const base_value: IR.Value  = this.base.lower(optimizer).asTac(optimizer);

		const non_nullish_base = (): IR.Value => {
			switch (true) {
				case this.accessor instanceof ASTNodeIndex: {
					assert_instanceof(base_type, TYPE.Tuple);
					return new IR.TupleGet(base_value, this.accessor.index, typ);
				}
				case this.accessor instanceof ASTNodeKey: {
					assert_instanceof(base_type, TYPE.Record);
					return new IR.RecordGet(base_value, this.accessor, typ);
				}
				default: {
					assert_instanceof(this.accessor, ASTNodeExpression);
					const accessor_value: IR.Value = this.accessor.lower(optimizer);
					return new IR.CollectionDynamicGet(
						(
							base_type instanceof TYPE.List ?         IR.TypeName.LIST :
							base_type instanceof TYPE.Dict ?         IR.TypeName.DICT :
							base_type instanceof TYPE.Set  ?         IR.TypeName.SET :
							(assert_instanceof(base_type, TYPE.Map), IR.TypeName.MAP)
						),
						base_value,
						accessor_value,
						typ,
					);
				}
			}
		};

		if (this.kind === Operator.DOT_MAY) {
			const block_else:  string = optimizer.newLabel();
			const block_endif: string = optimizer.newLabel();

			const result: IrLocal = optimizer.newTempLocal(this.type());

			optimizer.pushInstruction(new IR.GotoIfFalse(new IR.Unop(IR.UnOp.ISNULL, base_value, TYPE.BOOL), block_else));
			optimizer.pushInstruction(new IR.Set(result, new IR.Const(VALUE.NULL)));
			optimizer.pushInstruction(new IR.Goto(block_endif));
			optimizer.pushInstruction(new IR.Label(block_else));
			optimizer.pushInstruction(new IR.Set(result, non_nullish_base()));
			optimizer.pushInstruction(new IR.Label(block_endif));
			return new IR.Get(result);
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
