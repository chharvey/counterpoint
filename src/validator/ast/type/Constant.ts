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
		const node: SyntaxNode = this.start_node.namedChild(0)!;
		switch (true) {
			case isSyntaxNodeType(node, /^(integer|natural|float)$/): {
				return valueOfTokenNumber(node.text).toType();
			}
			case isSyntaxNodeType(node, 'string'): {
				return new VALUE.String(Validator.cookTokenString(node.text)).toType();
			}
			case isSyntaxNodeType(node, 'keyword_value'): {
				return Constant.keywordType(node.children[0].text);
			}
			default: {
				assert.strictEqual(this.start_node.children.length, 2, `Expected ${ this.start_node } to be a symbol.`);
				assert.ok(isSyntaxNodeType(node, 'word'));
				return new VALUE.Symbol(Validator.wordNodeId(node), node.text).toType();
			}
		}
	}
}
