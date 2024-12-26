import * as assert from 'assert';
import type binaryen from 'binaryen';
import type {SyntaxNode} from 'tree-sitter';
import {
	VALUE,
	type TYPE,
} from '../../index.js';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import {Keyword} from '../../parser/index.js';
import {
	type SyntaxNodeType,
	isSyntaxNodeType,
} from '../utils-private.js';
import {Validator} from '../Validator.js';
import {valueOfTokenNumber} from './utils-private.js';
import {buildDeco} from './decorators.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeConstant extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeConstant {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeConstant);
		return expression;
	}

	private static keywordValue(source: string): VALUE.Null | VALUE.Boolean {
		return (
			(source === Keyword.NULL)  ? VALUE.Null.NULL     :
			(source === Keyword.FALSE) ? VALUE.Boolean.FALSE :
			(source === Keyword.TRUE)  ? VALUE.Boolean.TRUE  :
			assert.fail(`ASTNodeConstant.keywordValue did not expect the keyword \`${ source }\`.`)
		);
	}


	public constructor(start_node: (
		| SyntaxNodeType<'integer'>
		| SyntaxNodeType<'template_full'>
		| SyntaxNodeType<'template_head'>
		| SyntaxNodeType<'template_middle'>
		| SyntaxNodeType<'template_tail'>
		| SyntaxNodeType<'primitive_literal'>
	)) {
		super(start_node);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		return this.fold().build(this.builder.module);
	}

	@memoizeMethod
	// @typeDeco // explicitly leaving off for performance
	public override type(): TYPE.Type {
		return this.fold().toType();
	}

	@memoizeMethod
	public override fold(): VALUE.Primitive {
		return (
			(isSyntaxNodeType(this.start_node, /^template_(full|head|middle|tail)$/)) ? new VALUE.String(Validator.cookTokenTemplate(this.start_node.text)) :
			(isSyntaxNodeType(this.start_node, 'integer'))                            ? valueOfTokenNumber(this.start_node.text, this.validator.config)   :
			(assert.ok(
				isSyntaxNodeType(this.start_node, 'primitive_literal'),
				`Expected ${ this.start_node } to be a primitive.`,
			), ((token: SyntaxNode) => (
				(isSyntaxNodeType(token, 'keyword_value'))                     ? ASTNodeConstant.keywordValue(token.text)              :
				(isSyntaxNodeType(token, /^integer(__radix)?(__separator)?$/)) ? valueOfTokenNumber(token.text, this.validator.config) :
				(isSyntaxNodeType(token, /^float(__separator)?$/))             ? valueOfTokenNumber(token.text, this.validator.config) :
				(assert.ok(
					isSyntaxNodeType(token, /^string(__comment)?(__separator)?$/),
					`Expected ${ token } to be a string.`,
				), new VALUE.String(Validator.cookTokenString(token.text, this.validator.config)))
			))(this.start_node.children[0]))
		);
	}
}
