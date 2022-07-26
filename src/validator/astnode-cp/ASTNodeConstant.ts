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
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeConstant extends ASTNodeExpression {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeConstant {
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
		| SyntaxNodeType<'integer'>
		| SyntaxNodeType<'template_full'>
		| SyntaxNodeType<'template_head'>
		| SyntaxNodeType<'template_middle'>
		| SyntaxNodeType<'template_tail'>
		| SyntaxNodeType<'primitive_literal'>
	) {
		super(start_node);
	}

	private get value(): SolidObject {
		return this._value ??= (
			(isSyntaxNodeType(this.start_node, /^template_(full|head|middle|tail)$/)) ? new SolidString(Validator.cookTokenTemplate(this.start_node.text)) :
			(isSyntaxNodeType(this.start_node, 'integer'))                            ? valueOfTokenNumber(this.start_node.text, this.validator.config) :
			(isSyntaxNodeType(this.start_node, 'primitive_literal'),                    ((token: SyntaxNode) => (
				(isSyntaxNodeType(token, 'keyword_value'))                     ? ASTNodeConstant.keywordValue(token.text) :
				(isSyntaxNodeType(token, /^integer(__radix)?(__separator)?$/)) ? valueOfTokenNumber(token.text, this.validator.config) :
				(isSyntaxNodeType(token, /^float(__separator)?$/))             ? valueOfTokenNumber(token.text, this.validator.config) :
				(isSyntaxNodeType(token, /^string(__comment)?(__separator)?$/),  new SolidString(Validator.cookTokenString(token.text, this.validator.config)))
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
		return new SolidTypeUnit(this.value);
	}
	protected override fold_do(): SolidObject {
		return this.value;
	}
}
