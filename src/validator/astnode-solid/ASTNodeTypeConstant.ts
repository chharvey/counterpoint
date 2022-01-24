import * as assert from 'assert';
import type {SyntaxNode} from 'tree-sitter';
import {
	SolidType,
	SolidTypeUnit,
	SolidBoolean,
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
	Keyword,
	TOKEN,
	SyntaxNodeType,
	isSyntaxNodeType,
} from './package.js';
import {
	valueOfTokenNumber,
	valueOfTokenString,
} from './utils-private.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeConstant extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeConstant {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeConstant);
		return typ;
	}

	private static keywordType(source: string): SolidType {
		return (
			(source === Keyword.VOID)  ? SolidType.VOID :
			(source === Keyword.NULL)  ? SolidType.NULL :
			(source === Keyword.BOOL)  ? SolidType.BOOL :
			(source === Keyword.FALSE) ? SolidBoolean.FALSETYPE :
			(source === Keyword.TRUE ) ? SolidBoolean.TRUETYPE :
			(source === Keyword.INT)   ? SolidType.INT :
			(source === Keyword.FLOAT) ? SolidType.FLOAT :
			(source === Keyword.STR)   ? SolidType.STR :
			(source === Keyword.OBJ)   ? SolidType.OBJ :
			(() => { throw new Error(`ASTNodeTypeConstant.keywordType did not expect the keyword \`${ source }\`.`); })()
		);
	}


	private _type: SolidType | null = null;

	constructor (start_node:
		| TOKEN.TokenKeyword
		| TOKEN.TokenNumber
		| TOKEN.TokenString
		| SyntaxNodeType<'keyword_type'>
		| SyntaxNodeType<'integer'>
		| SyntaxNodeType<'primitive_literal'>
	) {
		super(start_node);
	}
	protected override eval_do(): SolidType {
		return this._type ??= ('tree' in this.start_node) ? (
			(isSyntaxNodeType(this.start_node, 'keyword_type'))     ? ASTNodeTypeConstant.keywordType(this.start_node.text) :
			(isSyntaxNodeType(this.start_node, 'integer'))          ? new SolidTypeUnit(valueOfTokenNumber(this.start_node.text)) :
			(isSyntaxNodeType(this.start_node, 'primitive_literal'),  ((token: SyntaxNode) => (
				(isSyntaxNodeType(token, 'keyword_value'))                     ? ASTNodeTypeConstant.keywordType(token.text) :
				(isSyntaxNodeType(token, /^integer(__radix)?(__separator)?$/)) ? new SolidTypeUnit(valueOfTokenNumber(token.text)) :
				(isSyntaxNodeType(token, /^float(__separator)?$/))             ? new SolidTypeUnit(valueOfTokenNumber(token.text)) :
				(isSyntaxNodeType(token, /^string(__comment)?(__separator)?$/),  new SolidTypeUnit(valueOfTokenString(token.text)))
			))(this.start_node.children[0]))
		) : (
			(this.start_node instanceof TOKEN.TokenKeyword) ? ASTNodeTypeConstant.keywordType(this.start_node.source) :
			(this.start_node instanceof TOKEN.TokenNumber)  ? new SolidTypeUnit(valueOfTokenNumber(this.start_node)) :
			(this.start_node instanceof TOKEN.TokenString,    (Dev.supports('literalString-cook')) ? new SolidTypeUnit(valueOfTokenString(this.start_node as TOKEN.TokenString)) : (() => { throw new Error('`literalString-cook` not yet supported.'); })())
		);
	}
}
