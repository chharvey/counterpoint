import * as assert from 'assert';
import type {SyntaxNode} from 'tree-sitter';
import {
	SolidType,
	SolidObject,
	Primitive,
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
	Validator,
	SyntaxNodeType,
	isSyntaxNodeType,
} from './package.js';
import {
	valueOfTokenNumber,
} from './utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeConstant extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeConstant {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeConstant);
		return expression;
	}


	private static keywordValue(source: string): Primitive {
		return (
			(source === Keyword.NULL)  ? SolidNull.NULL :
			(source === Keyword.FALSE) ? SolidBoolean.FALSE :
			(source === Keyword.TRUE)  ? SolidBoolean.TRUE :
			(() => { throw new Error(`ASTNodeConstant.keywordValue did not expect the keyword \`${ source }\`.`); })()
		);
	}

	private _value: Primitive | null = null;

	constructor (start_node:
		| SyntaxNodeType<'integer'>
		| SyntaxNodeType<'template_full'>
		| SyntaxNodeType<'template_head'>
		| SyntaxNodeType<'template_middle'>
		| SyntaxNodeType<'template_tail'>
		| SyntaxNodeType<'primitive_literal'>
	) {
		super(start_node);
	}

	private get value(): Primitive {
		return this._value ??= (
			(isSyntaxNodeType(this.start_node, /^template_(full|head|middle|tail)$/)) ? (Dev.supports('literalTemplate-cook')) ? new SolidString(Validator.cookTokenTemplate(this.start_node.text)) : (() => { throw new Error('`literalTemplate-cook` not yet supported.'); })() :
			(isSyntaxNodeType(this.start_node, 'integer')) ? valueOfTokenNumber(this.start_node.text, this.validator.config) :
			(isSyntaxNodeType(this.start_node, 'primitive_literal'),  ((token: SyntaxNode) => (
				(isSyntaxNodeType(token, 'keyword_value'))                     ? ASTNodeConstant.keywordValue(token.text) :
				(isSyntaxNodeType(token, /^integer(__radix)?(__separator)?$/)) ? valueOfTokenNumber(token.text, this.validator.config) :
				(isSyntaxNodeType(token, /^float(__separator)?$/))             ? valueOfTokenNumber(token.text, this.validator.config) :
				(isSyntaxNodeType(token, /^string(__comment)?(__separator)?$/),  (Dev.supports('literalString-cook')) ? new SolidString(Validator.cookTokenString(token.text, this.validator.config)) : (() => { throw new Error('`literalString-cook` not yet supported.'); })())
			))(this.start_node.children[0]))
		);
	}

	override shouldFloat(): boolean {
		return this.value instanceof Float64
	}
	protected override build_do(_builder: Builder, to_float: boolean = false): INST.InstructionConst {
		return INST.InstructionConst.fromCPValue(this.fold(), to_float);
	}
	protected override type_do(): SolidType {
		return this.value.toType();
	}
	protected override fold_do(): SolidObject {
		if (this.value instanceof SolidString && !Dev.supports('stringConstant-assess')) {
			throw new Error('`stringConstant-assess` not yet supported.');
		};
		return this.value;
	}
}
