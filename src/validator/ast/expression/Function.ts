import * as xjs from 'extrajs';
import {
	type Builder,
	type OP,
	AssignmentErrorDuplicateKey,
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
	TYPE,
} from '../../../typer/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {ParameterFunction} from '../ParameterFunction.ts';
import type {Block} from '../Block.ts';
import {Expression} from './Expression.ts';



class ExpressionFunction extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ExpressionFunction {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, ExpressionFunction);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeType<'expression_function'>,
		public readonly parameters: readonly ParameterFunction[],
		public readonly block:      Block,
	) {
		super(start_node, {}, [...parameters, block]);
	}


	public override varCheck(): void {
		xjs.Array.forEachAggregated(this.parameters, (param) => param.varCheck());
		const key_ids: readonly bigint[] = this.parameters.filter((param) => param.named).map((param) => param.labelId!);
		xjs.Array.forEachAggregated(key_ids, (key_id, i) => {
			if (key_ids.slice(0, i).includes(key_id)) {
				throw new AssignmentErrorDuplicateKey(this.parameters[i].key ?? this.parameters[i].identifier!);
			}
		});
		return this.block.varCheck();
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		return new TYPE.Function(
			new TYPE.Tuple(this.parameters.filter((param) => !param.named).map((param) => ({
				type:     param.typenode.eval(),
				optional: false, // TODO: with optional paramers: `parameter.optional`
			}))),
			new TYPE.Record(new Map<bigint, EntryType>(this.parameters.filter((param) => param.named).map((param) => [
				param.labelId!,
				{
					type:     param.typenode.eval(),
					optional: false, // TODO: with optional paramers: `parameter.optional`
				},
			]))),
		);
	}


	@memoizeMethod
	public override build(_builder: Builder): OP.Value {
		throw new Error('`ExpressionFunction#build` not yet supported.');
	}
}
export {ExpressionFunction as Function};
