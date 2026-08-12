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
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import {
	Operator,
	type ValidOperatorCast,
} from '../../Operator.ts';
import {
	IntrinsicName,
	validate_intrinsic_name,
} from '../utils-private.ts';
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
		if (this.operator === Operator.IS) {
			// NOTE: ignore var-checking `this.operand1` for now, as semantics is determined by syntax.
			// (`this.operand1.source` must be an `IntrinsicName`)
			this.operand0.varCheck();
			validate_intrinsic_name(this.operand1.source);
		} else {
			return super.varCheck();
		}
	}

	public override typeCheck(): void {
		if (this.operator === Operator.IS) {
			// NOTE: ignore type-checking `this.operand1` for now, as semantics is determined by syntax.
			// (`this.operand1.source` must be an `IntrinsicName`)
			this.operand0.typeCheck();
			this.type(); // assert does not throw
		} else {
			return super.typeCheck();
		}
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		const t0 = this.operand0.type();
		if (t0.isBottomType) {
			return TYPE.NOTHING;
		}
		if (this.operator === Operator.IS) {
			// NOTE: ignore var-checking `this.operand1` for now, as semantics is determined by syntax.
			// (`this.operand1.source` must be an `IntrinsicName`)
			return TYPE.BOOL;
		} else {
			return this.type_do(t0, this.operand1.type());
		}
	}

	protected override type_do(_t0: TYPE.Type, _t1: TYPE.Type): TYPE.Type {
		throw new Error('OperationBinaryCast#type not yet supported.');
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Value {
		if (this.operator === Operator.IS) {
			// NOTE: ignore var-checking `this.operand1` for now, as semantics is determined by syntax.
			// (`this.operand1.source` must be an `IntrinsicName`)
			const op1_source = this.operand1.source as IntrinsicName;
			return new OP.InstanceOf(new Map<IntrinsicName, OP.InstanceOfName>([
				[IntrinsicName.BOOLEAN, OP.InstanceOfName.BOOLEAN],
				[IntrinsicName.SYMBOL,  OP.InstanceOfName.SYMBOL],
				[IntrinsicName.INTEGER, OP.InstanceOfName.INTEGER],
				[IntrinsicName.NATURAL, OP.InstanceOfName.NATURAL],
				[IntrinsicName.FLOAT,   OP.InstanceOfName.FLOAT],
				[IntrinsicName.STRING,  OP.InstanceOfName.STRING],
				// [IntrinsicName.OBJECT,  OP.InstanceOfName.OBJECT], // FIXME: support
				[IntrinsicName.LIST,    OP.InstanceOfName.LIST],
				[IntrinsicName.DICT,    OP.InstanceOfName.DICT],
				[IntrinsicName.SET,     OP.InstanceOfName.SET],
				[IntrinsicName.MAP,     OP.InstanceOfName.MAP],
				[IntrinsicName.MAYBE,   OP.InstanceOfName.MAYBE],
				[IntrinsicName.NONE,    OP.InstanceOfName.NONE],
				[IntrinsicName.SOME,    OP.InstanceOfName.SOME],
			]).get(op1_source)!, this.operand0.build(builder).asTac(builder));
		}
		throw new Error('`OperationBinaryCast#build` not yet supported.');
	}
}
