import * as assert from 'assert';
import type {SyntaxNode} from 'tree-sitter';
import {
	VALUE,
	TYPE,
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
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeConstant extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeConstant {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeConstant);
		return typ;
	}

	private static keywordType(source: string): TYPE.Type {
		return (
			source === Keyword.NEVER   ? TYPE.NEVER :
			source === Keyword.VOID    ? TYPE.VOID :
			source === Keyword.NULL    ? TYPE.NULL :
			source === Keyword.BOOL    ? TYPE.BOOL :
			source === Keyword.SYM     ? assert.fail('Successfully identified the `sym` type keyword.') :
			source === Keyword.FALSE   ? TYPE.FALSE :
			source === Keyword.TRUE    ? TYPE.TRUE :
			source === Keyword.INT     ? TYPE.INT :
			source === Keyword.FLOAT   ? TYPE.FLOAT :
			source === Keyword.STR     ? TYPE.STR :
			source === Keyword.UNKNOWN ? TYPE.UNKNOWN :
			assert.fail(`ASTNodeTypeConstant.keywordType did not expect the keyword \`${ source }\`.`)
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
			), ((children: readonly SyntaxNode[]) => (
				(isSyntaxNodeType(children[0], 'keyword_value'))                                               ? ASTNodeTypeConstant.keywordType(children[0].text) :
				(isSyntaxNodeType(children[0], /^integer(__radix)?(__separator)?$/))                           ? valueOfTokenNumber(children[0].text, this.validator.config).toType() :
				(isSyntaxNodeType(children[0], /^float(__separator)?$/))                                       ? valueOfTokenNumber(children[0].text, this.validator.config).toType() :
				(isSyntaxNodeType(children[0], /^string(__comment)?(__separator)?$/))                          ? new VALUE.String(Validator.cookTokenString(children[0].text, this.validator.config)).toType() :
				(assert.ok(isSyntaxNodeType(children[1], 'word'), `Expected ${ children[1] } to be a symbol.`),  assert.fail('Successfully identified a symbol literal type.'))
			))(this.start_node.children))
		);
	}
}
