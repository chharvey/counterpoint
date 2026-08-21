import {
	type Builder,
	OP,
	TypeErrorNotNarrow,
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
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import {
	Operator,
	type ValidOperatorCast,
} from '../../Operator.ts';
import {IntrinsicName} from '../utils-public.ts';
import {validate_intrinsic_name} from '../utils-private.ts';
import {Expression} from './Expression.ts';
import {OperationBinary} from './OperationBinary.ts';



export class OperationBinaryCast extends OperationBinary {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationBinaryCast {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, OperationBinaryCast);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorCast,
		operand0: Expression,
		operand1: Expression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	public override varCheck(): void {
		// NOTE: ignore var-checking `this.operand1` for now, as semantics is determined by syntax.
		// (`this.operand1.source` must be an `IntrinsicName`)
		this.operand0.varCheck();
		return validate_intrinsic_name(this.operand1.source);
	}

	public override typeCheck(): void {
		// NOTE: ignore type-checking `this.operand1` for now, as semantics is determined by syntax.
		// (`this.operand1.source` must be an `IntrinsicName`)
		this.operand0.typeCheck();
		this.type(); // assert does not throw
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		const t0: TYPE.Type = this.operand0.type();
		if (t0.isBottomType) {
			return TYPE.NOTHING;
		}
		const t1: TYPE.Type = new Map<IntrinsicName, TYPE.Type>([
			[IntrinsicName.NULL,    TYPE.NULL],
			[IntrinsicName.BOOLEAN, TYPE.BOOL],
			[IntrinsicName.SYMBOL,  TYPE.SYM],
			[IntrinsicName.INTEGER, TYPE.INT],
			[IntrinsicName.NATURAL, TYPE.NAT],
			[IntrinsicName.FLOAT,   TYPE.FLOAT],
			[IntrinsicName.STRING,  TYPE.STR],
			[IntrinsicName.OBJECT,  TYPE.OBJ],
			[IntrinsicName.LIST,    new TYPE.List(TYPE.ANYTHING)],
			[IntrinsicName.DICT,    new TYPE.Dict(TYPE.ANYTHING)],
			[IntrinsicName.SET,     new TYPE.Set(TYPE.ANYTHING)],
			[IntrinsicName.MAP,     new TYPE.Map(TYPE.ANYTHING, TYPE.ANYTHING)],
			[IntrinsicName.MAYBE,   new TYPE.Maybe(TYPE.ANYTHING)],
			[IntrinsicName.NONE,    new TYPE.None(TYPE.ANYTHING)],
			[IntrinsicName.SOME,    new TYPE.Some(TYPE.ANYTHING)],
		]).get(this.operand1.source as IntrinsicName)!;
		switch (this.operator) {
			case Operator.IS: {
				return TYPE.BOOL;
			}
			case Operator.CAST: {
				if (t1.isSubtypeOf(t0)) {
					return t1;
				} else {
					throw new TypeErrorNotNarrow(t1, t0, this.line_index, this.col_index);
				}
			}
			case Operator.CAST_MAYBE: {
				if (t1.isSubtypeOf(t0)) {
					return new TYPE.Maybe(t1);
				} else {
					throw new TypeErrorNotNarrow(t1, t0, this.line_index, this.col_index);
				}
			}
			case Operator.CAST_RESULT: {
				if (t1.isSubtypeOf(t0)) {
					throw new Error('`OperationBinaryCast[operator=RESULT]#type` not yet supported.');
				} else {
					throw new TypeErrorNotNarrow(t1, t0, this.line_index, this.col_index);
				}
			}
		}
	}

	protected override type_do(): never {
		throw new Error('`OperationBinaryCast#type_do` is not ever called.');
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Value {
		const op0: OP.ValueTac = this.operand0.build(builder).asTac(builder);
		const op1_source = this.operand1.source as IntrinsicName;
		function isInstance(): OP.Value {
			switch (op1_source) {
				case IntrinsicName.NULL: {
					return new OP.Binop(OP.OpCode.ID, op0, new OP.Const(VALUE.NULL), TYPE.BOOL);
				}
				case IntrinsicName.BOOLEAN: {
					const left: OP.ValueTac = new OP.Binop(OP.OpCode.ID, op0, new OP.Const(VALUE.FALSE), TYPE.BOOL).asTac(builder);
					return OP.conditional_expression(
						builder,
						TYPE.BOOL,
						() => left,
						() => left,
						() => new OP.Binop(OP.OpCode.ID, op0, new OP.Const(VALUE.TRUE), TYPE.BOOL),
					);
				}
			}
			return new OP.Instance(OP.OpCode.INSTANCEOF, op1_source, op0);
		}
		switch (this.operator) {
			case Operator.IS: {
				return isInstance();
			}
			case Operator.CAST: {
				return new OP.Instance(OP.OpCode.CAST, op1_source, op0);
			}
			case Operator.CAST_MAYBE: {
				const this_type = this.type() as TYPE.Maybe;
				return OP.conditional_expression(
					builder,
					this_type,
					isInstance,
					() => new OP.MaybeNew(this_type.typearg, new OP.Instance(OP.OpCode.CAST, op1_source, op0)),
					() => new OP.MaybeNew(this_type.typearg),
				);
			}
			case Operator.CAST_RESULT: {
				throw new Error('`OperationBinaryCast[operator=RESULT]#build` not yet supported.');
			}
		}
	}
}
