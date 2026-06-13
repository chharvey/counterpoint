import * as assert from 'node:assert';
import type {
	Builder,
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
import type {SyntaxNodeType} from '../../utils-private.ts';
import {STMT} from '../index.ts';
import type {Block} from '../Block.ts';
import {Expression} from './Expression.ts';



export class ExpressionBlock extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ExpressionBlock {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, ExpressionBlock);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeType<'expression_block'>,
		public readonly block: Block,
	) {
		super(start_node, {}, [block]);
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		if (this.block.hasBottomType) {
			return TYPE.NOTHING;
		}
		assert.ok(this.block.children.length, 'Expected Block to contain at least 1 statement.');
		const last_stmt: STMT.Statement = this.block.children.at(-1)!;
		/* TODO: For now, all block-expressions must have a type, thus must have a determinant.
		but after #46 (void functions), block-expressions don’t need a determinant and thus may have a “void” type.
		In those cases, instead of throwing errors here, return `null`. */
		if (!(last_stmt instanceof STMT.StatementExpression)) {
			throw new Error('The last statement of a block-expression must be an expression-statement.');
		}
		const expr: Expression | undefined = last_stmt.expr;
		if (!expr) {
			throw new Error('The determining expression-statement of a block-expression must be nonempty.');
		}
		return expr.type();
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Value {
		this.block.children.slice(0, -1).forEach((stmt) => stmt.build(builder));
		return (this.block.children.at(-1) as STMT.StatementExpression).expr!.build(builder);
	}
}
