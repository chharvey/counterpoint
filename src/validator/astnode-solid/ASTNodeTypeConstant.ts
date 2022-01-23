import * as assert from 'assert';
import {
	SolidType,
	SolidTypeUnit,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
	Keyword,
	TOKEN,
	SyntaxNodeType,
	isSyntaxNodeType,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';
import * as h from '../../../test/helpers-parse.js';



export class ASTNodeTypeConstant extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeConstant {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeConstant);
		return typ;
	}
	private readonly type: SolidType;
	constructor (start_node:
		| TOKEN.TokenKeyword
		| TOKEN.TokenNumber
		| TOKEN.TokenString
		| SyntaxNodeType<'keyword_type'>
		| SyntaxNodeType<'integer'>
		| SyntaxNodeType<'primitive_literal'>
	) {
		const value: SolidType = ((start_node: TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString) => (
			(start_node instanceof TOKEN.TokenKeyword) ?
				(start_node.source === Keyword.VOID)  ? SolidType.VOID :
				(start_node.source === Keyword.NULL)  ? SolidType.NULL :
				(start_node.source === Keyword.BOOL)  ? SolidType.BOOL :
				(start_node.source === Keyword.FALSE) ? SolidBoolean.FALSETYPE :
				(start_node.source === Keyword.TRUE ) ? SolidBoolean.TRUETYPE :
				(start_node.source === Keyword.INT)   ? SolidType.INT :
				(start_node.source === Keyword.FLOAT) ? SolidType.FLOAT :
				(start_node.source === Keyword.STR)   ? SolidType.STR :
				(start_node.source === Keyword.OBJ)   ? SolidType.OBJ :
				(() => { throw new Error(`ASTNodeTypeConstant.constructor did not expect the keyword \`${ start_node.source }\`.`); })()
			: (start_node instanceof TOKEN.TokenNumber) ?
				new SolidTypeUnit(
					start_node.isFloat
						? new Float64(start_node.cook())
						: new Int16(BigInt(start_node.cook()))
				)
			: (start_node instanceof TOKEN.TokenString, (Dev.supports('literalString-cook')) ? new SolidTypeUnit(new SolidString(start_node.cook())) : (() => { throw new Error('`literalString-cook` not yet supported.'); })())
		))(('tree' in start_node) ? (
			(isSyntaxNodeType(start_node, 'keyword_type'))     ? h.tokenKeywordFromTypeString(start_node.text) :
			(isSyntaxNodeType(start_node, 'integer'))          ? h.tokenLiteralFromTypeString(start_node.text) :
			(isSyntaxNodeType(start_node, 'primitive_literal'),  h.tokenLiteralFromTypeString(start_node.children[0].text))
		) : start_node);
		super(start_node, {value});
		this.type = value;
	}
	protected override eval_do(): SolidType {
		return this.type;
	}
}
