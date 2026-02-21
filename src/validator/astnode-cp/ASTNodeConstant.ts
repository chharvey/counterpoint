import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {SyntaxNode} from 'tree-sitter';
import {
	VALUE,
	type TYPE,
	type IR,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {Keyword} from '../../parser/index.ts';
import {
	type SyntaxNodeType,
	isSyntaxNodeType,
} from '../utils-private.ts';
import {Validator} from '../Validator.ts';
import {valueOfTokenNumber} from './utils-private.ts';
import {ASTNodeExpression} from './ASTNodeExpression.ts';



export class ASTNodeConstant extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeConstant {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeConstant);
		return expression;
	}

	private static keywordValue(source: string): VALUE.Null | VALUE.Boolean {
		return new Map<string, VALUE.Null | VALUE.Boolean>([
			[Keyword.NULL,  VALUE.NULL],
			[Keyword.FALSE, VALUE.FALSE],
			[Keyword.TRUE,  VALUE.TRUE],
		]).get(source) ?? assert.fail(`ASTNodeConstant.keywordValue did not expect the keyword \`${ source }\`.`);
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

	public override varCheck(): void {
		super.varCheck();
		if (
			isSyntaxNodeType(this.start_node, 'primitive_literal') &&
			this.start_node.children.length === 2 &&
			isSyntaxNodeType(this.start_node.children[1], 'word')
		) {
			this.validator.wordNodeID(this.start_node.children[1]);
		}
	}

	@memoizeMethod
	// @lowerDeco // explicitly leaving off for performance
	public override lower(): IR.Constant {
		return this.fold().lower();
	}

	@memoizeMethod
	// @buildDeco // explicitly leaving off for performance
	public override build(): binaryen.ExpressionRef {
		return this.fold().build(this.builder);
	}

	@memoizeMethod
	// @typeDeco // explicitly leaving off for performance
	public override type(): TYPE.Type {
		return this.fold().toType();
	}

	@memoizeMethod
	public override fold(): VALUE.Primitive {
		switch (true) {
			case isSyntaxNodeType(this.start_node, /^template_(full|head|middle|tail)$/): {
				return new VALUE.String(Validator.cookTokenTemplate(this.start_node.text));
			}
			default: {
				assert.ok(isSyntaxNodeType(this.start_node, 'primitive_literal'), `Expected ${ this.start_node } to be a primitive.`);
				const children: readonly SyntaxNode[] = this.start_node.children;
				switch (true) {
					case isSyntaxNodeType(children[0], 'keyword_value'): {
						return ASTNodeConstant.keywordValue(children[0].text);
					}
					case isSyntaxNodeType(children[0], /^integer(__radix)?(__separator)?$/): {
						return valueOfTokenNumber(children[0].text, this.validator.config);
					}
					case isSyntaxNodeType(children[0], /^float(__separator)?$/): {
						return valueOfTokenNumber(children[0].text, this.validator.config);
					}
					case isSyntaxNodeType(children[0], /^string(__comment)?(__separator)?$/): {
						return new VALUE.String(Validator.cookTokenString(children[0].text, this.validator.config));
					}
					default: {
						assert.strictEqual(children.length, 2);
						assert.ok(isSyntaxNodeType(children[1], 'word'), `Expected ${ children[1] } to be a symbol.`);
						return new VALUE.Symbol(this.validator.wordNodeID(children[1]), children[1].text);
					}
				}
			}
		}
	}
}
