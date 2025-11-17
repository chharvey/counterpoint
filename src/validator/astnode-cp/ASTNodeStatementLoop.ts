import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	TYPE,
	TypeErrorNotAssignable,
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
import type {ASTNodeBlock} from './index.ts';
import {if_constant_folding} from './Foldable.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './ASTNodeStatement.ts';



export class ASTNodeStatementLoop extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementLoop {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementLoop);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'statement_loop'>,
		private readonly doFirst:   boolean,
		private readonly until:     boolean,
		public  readonly condition: ASTNodeExpression,
		public  readonly block:     ASTNodeBlock,
	) {
		super(start_node, {doFirst, until}, [condition, block]);
	}

	@if_constant_folding
	public override get isFoldable(): boolean {
		throw new Error('TODO:');
	}

	public override varCheck(): void {
		// Do not call `super.varCheck()` as we VarCheck children in a different order.
		xjs.Array.forEachAggregated(this.doFirst ? [this.block, this.condition] : [this.condition, this.block], (c) => c.varCheck());
	}

	public override typeCheck(): void {
		super.typeCheck();
		const condition_type: TYPE.Type = this.condition.type();
		if (!condition_type.isSubtypeOf(TYPE.BOOL)) {
			throw new TypeErrorNotAssignable(condition_type, TYPE.BOOL, this.condition);
		}
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('TODO:');
	}
}
