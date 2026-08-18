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
import type {SymbolSchemaVar} from '../../index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Operator} from '../../Operator.ts';
import {Expression} from './Expression.ts';
import {Variable} from './Variable.ts';
import type {Access} from './Access.ts';



export class Isset extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Isset {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Isset);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeType<'expression_unary_keyword'>,
		public readonly assignee: Variable | Access,
	) {
		super(start_node, {operator: Operator.ISSET}, [assignee]);
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		const t: TYPE.Type = this.assignee.type();
		if (t.isBottomType) {
			return TYPE.NOTHING;
		}
		return TYPE.BOOL;
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Isset | OP.Unop {
		if (this.assignee instanceof Variable) {
			return new OP.Isset(this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar);
		}
		return new OP.Unop(OP.OpCode.ISNULL, this.assignee.build(builder).asTac(builder), TYPE.BOOL);
	}
}
