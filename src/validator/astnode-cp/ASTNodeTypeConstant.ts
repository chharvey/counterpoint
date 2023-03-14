import * as assert from 'assert';
import type {SyntaxNode} from 'tree-sitter';
import {
	OBJ,
	TYPE,
} from '../../index.js';
import {
	throw_expression,
	memoizeMethod,
} from '../../lib/index.js';
import {
	CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import {Keyword} from '../../parser/index.js';
import {Validator} from '../index.js';
import {
	SyntaxNodeType,
	isSyntaxNodeType,
} from '../utils-private.js';
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
			(source === Keyword.VOID)  ? TYPE.VOID             :
			(source === Keyword.NULL)  ? TYPE.NULL             :
			(source === Keyword.BOOL)  ? TYPE.BOOL             :
			(source === Keyword.FALSE) ? OBJ.Boolean.FALSETYPE :
			(source === Keyword.TRUE)  ? OBJ.Boolean.TRUETYPE  :
			(source === Keyword.INT)   ? TYPE.INT              :
			(source === Keyword.FLOAT) ? TYPE.FLOAT            :
			(source === Keyword.STR)   ? TYPE.STR              :
			(source === Keyword.OBJ)   ? TYPE.OBJ              :
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
			(isSyntaxNodeType(this.start_node, 'keyword_type')) ?     ASTNodeTypeConstant.keywordType(this.start_node.text)                    :
			(isSyntaxNodeType(this.start_node, 'integer'))      ?     valueOfTokenNumber(this.start_node.text, this.validator.config).toType() :
			(assert.ok(
				isSyntaxNodeType(this.start_node, 'primitive_literal'),
				`Expected ${ this.start_node } to be a primitive.`,
			), ((token: SyntaxNode) => (
				(isSyntaxNodeType(token, 'keyword_value'))                     ? ASTNodeTypeConstant.keywordType(token.text)                    :
				(isSyntaxNodeType(token, /^integer(__radix)?(__separator)?$/)) ? valueOfTokenNumber(token.text, this.validator.config).toType() :
				(isSyntaxNodeType(token, /^float(__separator)?$/))             ? valueOfTokenNumber(token.text, this.validator.config).toType() :
				(assert.ok(
					isSyntaxNodeType(token, /^string(__comment)?(__separator)?$/),
					`Expected ${ token } to be a string.`,
				), new OBJ.String(Validator.cookTokenString(token.text, this.validator.config)).toType())
			))(this.start_node.children[0]))
		);
	}
}
