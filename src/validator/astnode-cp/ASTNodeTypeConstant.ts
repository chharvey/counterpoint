import * as assert from 'node:assert';
import type {SyntaxNode} from 'tree-sitter';
import {
	VALUE,
	TYPE,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {Keyword} from '../../parser/index.ts';
import {
	type SyntaxNodeType,
	isSyntaxNodeType,
} from '../utils-private.ts';
import {Validator} from '../Validator.ts';
import {valueOfTokenNumber} from './utils-private.ts';
import {ASTNodeType} from './ASTNodeType.ts';



export class ASTNodeTypeConstant extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeConstant {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeConstant);
		return typ;
	}

	private static keywordType(source: string): TYPE.Type {
		return new Map<string, TYPE.Type>([
			[Keyword.NOTHING,  TYPE.NOTHING],
			[Keyword.NULL,     TYPE.NULL],
			[Keyword.BOOL,     TYPE.BOOL],
			[Keyword.SYM,      TYPE.SYM],
			[Keyword.FALSE,    TYPE.FALSE],
			[Keyword.TRUE,     TYPE.TRUE],
			[Keyword.INT,      TYPE.INT],
			[Keyword.NAT,      TYPE.NAT],
			[Keyword.FLOAT,    TYPE.FLOAT],
			[Keyword.STR,      TYPE.STR],
			[Keyword.ANYTHING, TYPE.ANYTHING],
		]).get(source) ?? assert.fail(`ASTNodeTypeConstant.keywordType did not expect the keyword \`${ source }\`.`);
	}


	public constructor(start_node: (
		| SyntaxNodeType<'keyword_type'>
		| SyntaxNodeType<'primitive_literal'>
	)) {
		super(start_node);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		if (isSyntaxNodeType(this.start_node, 'keyword_type')) {
			return ASTNodeTypeConstant.keywordType(this.start_node.children[0].text);
		}
		assert.ok(isSyntaxNodeType(this.start_node, 'primitive_literal'), `Expected ${ this.start_node } to be a primitive.`);
		const children: readonly SyntaxNode[] = this.start_node.children;
		switch (true) {
			case isSyntaxNodeType(children[0], /^(integer|natural|float)$/): {
				return valueOfTokenNumber(children[0].text).toType();
			}
			case isSyntaxNodeType(children[0], 'string'): {
				return new VALUE.String(Validator.cookTokenString(children[0].text)).toType();
			}
			case isSyntaxNodeType(children[0], 'keyword_value'): {
				return ASTNodeTypeConstant.keywordType(children[0].children[0].text);
			}
			default: {
				assert.ok(isSyntaxNodeType(children[1], 'word'), `Expected ${ children[1] } to be a symbol.`);
				return new VALUE.Symbol(this.validator.wordNodeID(children[1]), children[1].text).toType();
			}
		}
	}
}
