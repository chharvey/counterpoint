import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import {Expression} from './Expression.ts';



export class Variable extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Variable {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Variable);
		return expression;
	}


	public readonly id: bigint = Validator.cookTokenIdentifier(this.start_node.text);

	public isFuncRef: boolean = false;


	public constructor(start_node: SyntaxNodeType<'identifier'>) {
		super(start_node);
	}
}
