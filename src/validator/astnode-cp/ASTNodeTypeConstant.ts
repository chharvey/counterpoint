import * as assert from 'assert';
import type {SyntaxNode} from 'tree-sitter';
import {
	TYPE,
	SolidBoolean,
	SolidString,
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

	private static keywordType(source: string): TYPE.SolidType {
		return (
			(source === Keyword.VOID)  ? TYPE.SolidType.VOID :
			(source === Keyword.NULL)  ? TYPE.SolidType.NULL :
			(source === Keyword.BOOL)  ? TYPE.SolidType.BOOL :
			(source === Keyword.FALSE) ? SolidBoolean.FALSETYPE :
			(source === Keyword.TRUE ) ? SolidBoolean.TRUETYPE :
			(source === Keyword.INT)   ? TYPE.SolidType.INT :
			(source === Keyword.FLOAT) ? TYPE.SolidType.FLOAT :
			(source === Keyword.STR)   ? TYPE.SolidType.STR :
			(source === Keyword.OBJ)   ? TYPE.SolidType.OBJ :
			(() => { throw new Error(`ASTNodeTypeConstant.keywordType did not expect the keyword \`${ source }\`.`); })()
		);
	}


	private _type: TYPE.SolidType | null = null;

	constructor (start_node:
		| SyntaxNodeType<'keyword_type'>
		| SyntaxNodeType<'integer'>
		| SyntaxNodeType<'primitive_literal'>
	) {
		super(start_node);
	}
	protected override eval_do(): TYPE.SolidType {
		return this._type ??= (
			(isSyntaxNodeType(this.start_node, 'keyword_type'))     ? ASTNodeTypeConstant.keywordType(this.start_node.text) :
			(isSyntaxNodeType(this.start_node, 'integer'))          ? new TYPE.SolidTypeUnit(valueOfTokenNumber(this.start_node.text, this.validator.config)) :
			(isSyntaxNodeType(this.start_node, 'primitive_literal'),  ((token: SyntaxNode) => (
				(isSyntaxNodeType(token, 'keyword_value'))                     ? ASTNodeTypeConstant.keywordType(token.text) :
				(isSyntaxNodeType(token, /^integer(__radix)?(__separator)?$/)) ? new TYPE.SolidTypeUnit(valueOfTokenNumber(token.text, this.validator.config)) :
				(isSyntaxNodeType(token, /^float(__separator)?$/))             ? new TYPE.SolidTypeUnit(valueOfTokenNumber(token.text, this.validator.config)) :
				(isSyntaxNodeType(token, /^string(__comment)?(__separator)?$/),  new TYPE.SolidTypeUnit(new SolidString(Validator.cookTokenString(token.text, this.validator.config))))
			))(this.start_node.children[0]))
		);
	}
}
