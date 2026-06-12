import * as assert from 'node:assert';
import {TypeErrorInvalidOperation} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {
	Operator,
	type ValidTypeOperator,
} from '../../Operator.ts';
import type {Type} from './Type.ts';
import {TypeOperation} from './Operation.ts';



export class TypeOperationUnary extends TypeOperation {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): TypeOperationUnary {
		const typ: TypeOperation = TypeOperation.fromSource(src, config);
		assert_instanceof(typ, TypeOperationUnary);
		return typ;
	}

	public constructor(
		start_node:
			| SyntaxNodeType<'type_unary_symbol'>
			| SyntaxNodeType<'type_unary_keyword'>,

		operator: ValidTypeOperator,
		private readonly operand: Type,
	) {
		super(start_node, operator, [operand]);
		if ([Operator.OREXCP].includes(this.operator)) {
			throw new TypeError(`Operator ${ this.operator } not yet supported.`);
		}
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		const t: TYPE.Type = this.operand.eval();
		if (this.operator === Operator.MUTABLE && !t.isReference) {
			throw new TypeErrorInvalidOperation(this);
		}
		return (
			(this.operator === Operator.ORNULL)  ? t.union(TYPE.NULL) :
			(this.operator === Operator.MUTABLE) ? t.mutableOf()      :
			assert.fail(`TypeOperationUnary#eval did not expect the operator \`${ Operator[this.operator] }\`.`)
		);
	}
}
