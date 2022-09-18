import * as assert from 'assert';
import type {SyntaxNode} from 'tree-sitter';
import {
	TYPE,
	OBJ,
	memoizeMethod,
	CPConfig,
	CONFIG_DEFAULT,
	Keyword,
	Validator,
	SyntaxNodeType,
	isSyntaxNodeType,
} from './package.js';
import {
	valueOfTokenNumber,
} from './utils-private.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeConstant extends ASTNodeType {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeConstant {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeConstant);
		return typ;
	}

	private static keywordType(source: string): TYPE.Type {
		return (
			(source === Keyword.VOID)  ? TYPE.Type.VOID :
			(source === Keyword.NULL)  ? TYPE.Type.NULL :
			(source === Keyword.BOOL)  ? TYPE.Type.BOOL :
			(source === Keyword.FALSE) ? OBJ.Boolean.FALSETYPE :
			(source === Keyword.TRUE ) ? OBJ.Boolean.TRUETYPE :
			(source === Keyword.INT)   ? TYPE.Type.INT :
			(source === Keyword.FLOAT) ? TYPE.Type.FLOAT :
			(source === Keyword.STR)   ? TYPE.Type.STR :
			(source === Keyword.OBJ)   ? TYPE.Type.OBJ :
			(() => { throw new Error(`ASTNodeTypeConstant.keywordType did not expect the keyword \`${ source }\`.`); })()
		);
	}


	constructor (start_node:
		| SyntaxNodeType<'keyword_type'>
		| SyntaxNodeType<'integer'>
		| SyntaxNodeType<'primitive_literal'>
	) {
		super(start_node);
	}
	@memoizeMethod
	override eval(): TYPE.Type {
		return (
			(isSyntaxNodeType(this.start_node, 'keyword_type'))     ? ASTNodeTypeConstant.keywordType(this.start_node.text) :
			(isSyntaxNodeType(this.start_node, 'integer'))          ? new TYPE.TypeUnit<OBJ.Integer | OBJ.Float>(valueOfTokenNumber(this.start_node.text, this.validator.config)) :
			(isSyntaxNodeType(this.start_node, 'primitive_literal'),  ((token: SyntaxNode) => (
				(isSyntaxNodeType(token, 'keyword_value'))                     ? ASTNodeTypeConstant.keywordType(token.text) :
				(isSyntaxNodeType(token, /^integer(__radix)?(__separator)?$/)) ? new TYPE.TypeUnit<OBJ.Integer | OBJ.Float>(valueOfTokenNumber(token.text, this.validator.config)) :
				(isSyntaxNodeType(token, /^float(__separator)?$/))             ? new TYPE.TypeUnit<OBJ.Integer | OBJ.Float>(valueOfTokenNumber(token.text, this.validator.config)) :
				(isSyntaxNodeType(token, /^string(__comment)?(__separator)?$/) , new TYPE.TypeUnit<OBJ.String>(new OBJ.String(Validator.cookTokenString(token.text, this.validator.config))))
			))(this.start_node.children[0]))
		);
	}
}
