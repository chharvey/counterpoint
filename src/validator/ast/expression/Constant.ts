import * as assert from 'node:assert';
import type {SyntaxNode} from 'tree-sitter';
import {OP} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	memoizeGetter,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {
	VALUE,
	type TYPE,
} from '../../../typer/index.ts';
import {Keyword} from '../../../parser/index.ts';
import {
	type SyntaxNodeType,
	isSyntaxNodeType,
} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import {valueOfTokenNumber} from '../utils-private.ts';
import {Expression} from './Expression.ts';



export class Constant extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Constant {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Constant);
		return expression;
	}

	private static keywordValue(source: string): VALUE.Null | VALUE.Boolean {
		return new Map<string, VALUE.Null | VALUE.Boolean>([
			[Keyword.NULL,  VALUE.NULL],
			[Keyword.FALSE, VALUE.FALSE],
			[Keyword.TRUE,  VALUE.TRUE],
		]).get(source) ?? assert.fail(`Constant.keywordValue did not expect the keyword \`${ source }\`.`);
	}


	public constructor(start_node: (
		| SyntaxNodeType<'template_full'>
		| SyntaxNodeType<'template_head'>
		| SyntaxNodeType<'template_middle'>
		| SyntaxNodeType<'template_tail'>
		| SyntaxNodeType<'primitive_literal'>
	)) {
		super(start_node);
	}

	@memoizeGetter
	public get interpreterValue(): VALUE.Primitive {
		if (isSyntaxNodeType(this.start_node, /^template_(full|head|middle|tail)$/)) {
			return new VALUE.String(Validator.cookTokenTemplate(this.start_node.text));
		}
		assert.ok(isSyntaxNodeType(this.start_node, 'primitive_literal'), `Expected ${ this.start_node } to be a primitive.`);
		const children: readonly SyntaxNode[] = this.start_node.children;
		switch (true) {
			case isSyntaxNodeType(children[0], /^(integer|natural|float)$/): {
				return valueOfTokenNumber(children[0].text);
			}
			case isSyntaxNodeType(children[0], 'string'): {
				return new VALUE.String(Validator.cookTokenString(children[0].text));
			}
			case isSyntaxNodeType(children[0], 'keyword_value'): {
				return Constant.keywordValue(children[0].children[0].text);
			}
			default: {
				assert.strictEqual(children.length, 2);
				assert.ok(isSyntaxNodeType(children[1], 'word'), `Expected ${ children[1] } to be a symbol.`);
				return new VALUE.Symbol(Validator.wordNodeId(children[1]), children[1].text);
			}
		}
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		return this.interpreterValue.toType();
	}

	@memoizeMethod
	public override build(): OP.Const {
		return new OP.Const(this.interpreterValue);
	}
}
