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
		const node: SyntaxNode = this.start_node.namedChild(0)!;
		switch (true) {
			case isSyntaxNodeType(node, /^(integer|natural|float)$/): {
				return valueOfTokenNumber(node.text);
			}
			case isSyntaxNodeType(node, 'string'): {
				return new VALUE.String(Validator.cookTokenString(node.text));
			}
			case isSyntaxNodeType(node, 'keyword_value'): {
				return Constant.keywordValue(node.children[0].text);
			}
			default: {
				assert.strictEqual(this.start_node.children.length, 2, `Expected ${ this.start_node } to be a symbol.`);
				assert.ok(isSyntaxNodeType(node, 'word'));
				return new VALUE.Symbol(Validator.wordNodeId(node), node.text);
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
