import {
	type Builder,
	OP,
} from '../../../index.ts';
import {
	assert_instanceof,
	noopGetter,
	memoizeGetter,
	runOnceMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {
	typecheck_assign,
	type AstNode,
} from '../AstNode.ts';
import {is_Functionlike} from '../Functionlike.ts';
import type * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class StatementReturn extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementReturn {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementReturn);
		return statement;
	}


	public constructor(
		start_node: SyntaxNodeType<'statement_return'>,
		private readonly expression: EXPR.Expression | null,
	) {
		super(start_node, {}, expression ? [expression] : []);
	}

	public override typeCheck(): void {
		super.typeCheck();
		let parent: AstNode | undefined = this.parent;
		while (parent && !is_Functionlike(parent)) {
			parent = parent.parent;
		}
		if (!parent) {
			return;
		}
		const return_type: TYPE.Type | undefined = parent.returnType?.eval();
		if (this.expression) {
			if (return_type) {
				return typecheck_assign(this.expression, return_type, this);
			} else {
				throw new Error(`Expression \`${ this.expression.source }\` is returned from a void function.`); // TODO: create new TypeError subclass
			}
		} else if (return_type) {
			throw new Error(`A function with return type \`${ return_type }\` does not return a value.`); // TODO: create new TypeError subclass
		}
	}

	@noopGetter(memoizeGetter)
	public override get hasBottomType(): boolean {
		return this.expression?.type().isBottomType ?? false;
	}

	@runOnceMethod
	public override build(builder: Builder): void {
		builder.terminateBlock(new OP.Goto('caller'));
		builder.initiateBlock(builder.newLabel(true));
	}
}
