import * as assert from 'node:assert';
import type {SyntaxNode} from 'tree-sitter';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import {Keyword} from '../../../parser/index.ts';
import {
	type SyntaxNodeType,
	isSyntaxNodeType,
} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import {valueOfTokenNumber} from '../utils-private.ts';
import {Type} from './Type.ts';



export class Constant extends Type {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Constant {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, Constant);
		return typ;
	}

	private static keywordType(source: string): TYPE.Type {
		return new Map<string, TYPE.Type>([
			[Keyword.NOTHING,  TYPE.NOTHING],
			[Keyword.BOOL,     TYPE.BOOL],
			[Keyword.SYM,      TYPE.SYM],
			[Keyword.INT,      TYPE.INT],
			[Keyword.NAT,      TYPE.NAT],
			[Keyword.FLOAT,    TYPE.FLOAT],
			[Keyword.STR,      TYPE.STR],
			[Keyword.ANYTHING, TYPE.ANYTHING],
			[Keyword.NULL,     TYPE.NULL],
			[Keyword.FALSE,    TYPE.FALSE],
			[Keyword.TRUE,     TYPE.TRUE],
		]).get(source) ?? assert.fail(`TypeConstant.keywordType did not expect the keyword \`${ source }\`.`);
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
			return Constant.keywordType(this.start_node.children[0].text);
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
				return Constant.keywordType(children[0].children[0].text);
			}
			default: {
				assert.ok(isSyntaxNodeType(children[1], 'word'), `Expected ${ children[1] } to be a symbol.`);
				return new VALUE.Symbol(this.validator.wordNodeID(children[1]), children[1].text).toType();
			}
		}
	}
}
