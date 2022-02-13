import * as assert from 'assert';
import type {SyntaxNode} from 'tree-sitter';
import {
	SolidType,
	SolidTypeUnit,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Float64,
	SolidString,
	INST,
	Builder,
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
	valueOfTokenTemplate,
} from './utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeConstant extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeConstant {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeConstant);
		return expression;
	}


	private static keywordValue(source: string): SolidObject {
		return (
			(source === Keyword.NULL)  ? SolidNull.NULL :
			(source === Keyword.FALSE) ? SolidBoolean.FALSE :
			(source === Keyword.TRUE)  ? SolidBoolean.TRUE :
			(() => { throw new Error(`ASTNodeConstant.keywordValue did not expect the keyword \`${ source }\`.`); })()
		);
	}

	private _value: SolidObject | null = null;

	constructor (start_node:
		| TOKEN.TokenKeyword
		| TOKEN.TokenNumber
		| TOKEN.TokenString
		| TOKEN.TokenTemplate
		| SyntaxNodeType<'template_full'>
		| SyntaxNodeType<'template_head'>
		| SyntaxNodeType<'template_middle'>
		| SyntaxNodeType<'template_tail'>
		| SyntaxNodeType<'integer'>
		| SyntaxNodeType<'primitive_literal'>
	) {
		super(start_node);
	}

	private get value(): SolidObject {
		return this._value ??= ('tree' in this.start_node) ? (
			(isSyntaxNodeType(this.start_node, 'template_full'))    ? valueOfTokenTemplate (this.start_node.text) :
			(isSyntaxNodeType(this.start_node, 'template_head'))    ? valueOfTokenTemplate (this.start_node.text) :
			(isSyntaxNodeType(this.start_node, 'template_middle'))  ? valueOfTokenTemplate (this.start_node.text) :
			(isSyntaxNodeType(this.start_node, 'template_tail'))    ? valueOfTokenTemplate (this.start_node.text) :
			(isSyntaxNodeType(this.start_node, 'integer'))          ? valueOfTokenNumber   (this.start_node.text, this.validator.config) :
			(isSyntaxNodeType(this.start_node, 'primitive_literal'),  ((token: SyntaxNode) => (
				(isSyntaxNodeType(token, 'keyword_value'))                     ? ASTNodeConstant.keywordValue(token.text) :
				(isSyntaxNodeType(token, /^integer(__radix)?(__separator)?$/)) ? valueOfTokenNumber(token.text, this.validator.config) :
				(isSyntaxNodeType(token, /^float(__separator)?$/))             ? valueOfTokenNumber(token.text, this.validator.config) :
				(isSyntaxNodeType(token, /^string(__comment)?(__separator)?$/),  valueOfTokenString(token.text, this.validator.config))
			))(this.start_node.children[0]))
		) : (
			(this.start_node instanceof TOKEN.TokenKeyword) ? ASTNodeConstant.keywordValue(this.start_node.source) :
			(this.start_node instanceof TOKEN.TokenNumber)  ? valueOfTokenNumber(this.start_node, this.validator.config) :
			(this.start_node instanceof TOKEN.TokenString)  ? (Dev.supports('literalString-cook'))   ? valueOfTokenString   (this.start_node, this.validator.config) : (() => { throw new Error('`literalString-cook` not yet supported.'); })() :
			(this.start_node instanceof TOKEN.TokenTemplate,  (Dev.supports('literalTemplate-cook')) ? valueOfTokenTemplate (this.start_node as TOKEN.TokenTemplate) : (() => { throw new Error('`literalTemplate-cook` not yet supported.'); })())
		);
	}

	override shouldFloat(): boolean {
		return this.value instanceof Float64
	}
	protected override build_do(_builder: Builder, to_float: boolean = false): INST.InstructionConst {
		return INST.InstructionConst.fromCPValue(this.fold(), to_float);
	}
	protected override type_do(): SolidType {
		return new SolidTypeUnit(this.value);
	}
	protected override fold_do(): SolidObject {
		if (this.value instanceof SolidString && !Dev.supports('stringConstant-assess')) {
			throw new Error('`stringConstant-assess` not yet supported.');
		};
		return this.value;
	}
}
