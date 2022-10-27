import * as assert from 'assert';
import type {SyntaxNode} from 'tree-sitter';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	throw_expression,
	CPConfig,
	CONFIG_DEFAULT,
	Keyword,
	Validator,
	SyntaxNodeType,
	isSyntaxNodeType,
} from './package.js';
import {valueOfTokenNumber} from './utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeConstant extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeConstant {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeConstant);
		return expression;
	}


	private static keywordValue(source: string): OBJ.Object {
		return (
			(source === Keyword.NULL)  ? OBJ.Null.NULL :
			(source === Keyword.FALSE) ? OBJ.Boolean.FALSE :
			(source === Keyword.TRUE)  ? OBJ.Boolean.TRUE :
			throw_expression(new Error(`ASTNodeConstant.keywordValue did not expect the keyword \`${ source }\`.`))
		);
	}

	private _value: OBJ.Object | null = null;

	public constructor(start_node: (
		| SyntaxNodeType<'integer'>
		| SyntaxNodeType<'template_full'>
		| SyntaxNodeType<'template_head'>
		| SyntaxNodeType<'template_middle'>
		| SyntaxNodeType<'template_tail'>
		| SyntaxNodeType<'primitive_literal'>
	)) {
		super(start_node);
	}

	private get value(): OBJ.Object {
		return this._value ??= (
			(isSyntaxNodeType(this.start_node, /^template_(full|head|middle|tail)$/)) ? new OBJ.String(Validator.cookTokenTemplate(this.start_node.text)) :
			(isSyntaxNodeType(this.start_node, 'integer'))                            ? valueOfTokenNumber(this.start_node.text, this.validator.config) :
			(isSyntaxNodeType(this.start_node, 'primitive_literal'),                    ((token: SyntaxNode) => (
				(isSyntaxNodeType(token, 'keyword_value'))                     ? ASTNodeConstant.keywordValue(token.text) :
				(isSyntaxNodeType(token, /^integer(__radix)?(__separator)?$/)) ? valueOfTokenNumber(token.text, this.validator.config) :
				(isSyntaxNodeType(token, /^float(__separator)?$/))             ? valueOfTokenNumber(token.text, this.validator.config) :
				(isSyntaxNodeType(token, /^string(__comment)?(__separator)?$/),  new OBJ.String(Validator.cookTokenString(token.text, this.validator.config)))
			))(this.start_node.children[0]))
		);
	}

	public override shouldFloat(): boolean {
		return this.value instanceof OBJ.Float;
	}

	protected override build_do(_builder: Builder, to_float: boolean = false): INST.InstructionConst {
		return INST.InstructionConst.fromCPValue(this.fold(), to_float);
	}

	protected override type_do(): TYPE.Type {
		return new TYPE.TypeUnit(this.value);
	}

	protected override fold_do(): OBJ.Object {
		return this.value;
	}
}
