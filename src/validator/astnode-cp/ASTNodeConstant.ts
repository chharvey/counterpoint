import * as assert from 'assert';
import type binaryen from 'binaryen';
import type {SyntaxNode} from 'tree-sitter';
import {
	OBJ,
	type TYPE,
	type Builder,
} from '../../index.js';
import {
	throw_expression,
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
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeConstant extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeConstant {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeConstant);
		return expression;
	}

	private static keywordValue(source: string): OBJ.Null | OBJ.Boolean {
		return (
			(source === Keyword.NULL)  ? OBJ.Null.NULL     :
			(source === Keyword.FALSE) ? OBJ.Boolean.FALSE :
			(source === Keyword.TRUE)  ? OBJ.Boolean.TRUE  :
			throw_expression(new Error(`ASTNodeConstant.keywordValue did not expect the keyword \`${ source }\`.`))
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
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): binaryen.ExpressionRef {
		return this.fold().build(builder.module);
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		return this.fold().toType();
	}

	@memoizeMethod
	public override fold(): OBJ.Primitive {
		return (
			(isSyntaxNodeType(this.start_node, /^template_(full|head|middle|tail)$/)) ? new OBJ.String(Validator.cookTokenTemplate(this.start_node.text)) :
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
				), new OBJ.String(Validator.cookTokenString(token.text, this.validator.config)))
			))(this.start_node.children[0]))
		);
	}
}
