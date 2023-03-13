import * as assert from 'assert';
import type {SyntaxNode} from 'tree-sitter';
import {
	SolidType,
	SolidBoolean,
	SolidString,
	SolidConfig,
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
		| SyntaxNodeType<'keyword_type'>
		| SyntaxNodeType<'integer'>
		| SyntaxNodeType<'primitive_literal'>
	) {
		super(start_node);
	}
	protected override eval_do(): SolidType {
		return this._type ??= (
			(isSyntaxNodeType(this.start_node, 'keyword_type'))     ? ASTNodeTypeConstant.keywordType(this.start_node.text) :
			(isSyntaxNodeType(this.start_node, 'integer'))          ? valueOfTokenNumber(this.start_node.text, this.validator.config).toType() :
			(isSyntaxNodeType(this.start_node, 'primitive_literal'),  ((token: SyntaxNode) => (
				(isSyntaxNodeType(token, 'keyword_value'))                     ? ASTNodeTypeConstant.keywordType(token.text) :
				(isSyntaxNodeType(token, /^integer(__radix)?(__separator)?$/)) ? valueOfTokenNumber(token.text, this.validator.config).toType() :
				(isSyntaxNodeType(token, /^float(__separator)?$/))             ? valueOfTokenNumber(token.text, this.validator.config).toType() :
				(isSyntaxNodeType(token, /^string(__comment)?(__separator)?$/),  new SolidString(Validator.cookTokenString(token.text, this.validator.config)).toType())
			))(this.start_node.children[0]))
		);
	}
}
