import * as assert from 'assert';
import type {SyntaxNode} from 'tree-sitter';
import {
	TYPE,
	OBJ,
	throw_expression,
	memoizeMethod,
	CPConfig,
	CONFIG_DEFAULT,
	Keyword,
	Validator,
	SyntaxNodeType,
	isSyntaxNodeType,
} from './package.js';
import {valueOfTokenNumber} from './utils-private.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeConstant extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeConstant {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeConstant);
		return typ;
	}

	private static keywordType(source: string): TYPE.Type {
		return (
			(source === Keyword.VOID)  ? TYPE.VOID :
			(source === Keyword.NULL)  ? TYPE.NULL :
			(source === Keyword.BOOL)  ? TYPE.BOOL :
			(source === Keyword.FALSE) ? OBJ.Boolean.FALSETYPE :
			(source === Keyword.TRUE)  ? OBJ.Boolean.TRUETYPE :
			(source === Keyword.INT)   ? TYPE.INT :
			(source === Keyword.FLOAT) ? TYPE.FLOAT :
			(source === Keyword.STR)   ? TYPE.STR :
			(source === Keyword.OBJ)   ? TYPE.OBJ :
			throw_expression(new Error(`ASTNodeTypeConstant.keywordType did not expect the keyword \`${ source }\`.`))
		);
	}


	public constructor(start_node: (
		| SyntaxNodeType<'keyword_type'>
		| SyntaxNodeType<'integer'>
		| SyntaxNodeType<'primitive_literal'>
	)) {
		super(start_node);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return (
			(isSyntaxNodeType(this.start_node, 'keyword_type'))     ? ASTNodeTypeConstant.keywordType(this.start_node.text) :
			(isSyntaxNodeType(this.start_node, 'integer'))          ? new TYPE.TypeUnit<OBJ.Integer | OBJ.Float>(valueOfTokenNumber(this.start_node.text, this.validator.config)) :
			(isSyntaxNodeType(this.start_node, 'primitive_literal'),  ((token: SyntaxNode) => (
				(isSyntaxNodeType(token, 'keyword_value'))                     ? ASTNodeTypeConstant.keywordType(token.text) :
				(isSyntaxNodeType(token, /^integer(__radix)?(__separator)?$/)) ? new TYPE.TypeUnit<OBJ.Integer | OBJ.Float>(valueOfTokenNumber(token.text, this.validator.config)) :
				(isSyntaxNodeType(token, /^float(__separator)?$/))             ? new TYPE.TypeUnit<OBJ.Integer | OBJ.Float>(valueOfTokenNumber(token.text, this.validator.config)) :
				(isSyntaxNodeType(token, /^string(__comment)?(__separator)?$/),  new TYPE.TypeUnit<OBJ.String>(new OBJ.String(Validator.cookTokenString(token.text, this.validator.config))))
			))(this.start_node.children[0]))
		);
	}
}
