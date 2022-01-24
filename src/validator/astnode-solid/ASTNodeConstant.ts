import * as assert from 'assert';
import {
	SolidType,
	SolidTypeUnit,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
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
import {ASTNodeExpression} from './ASTNodeExpression.js';
import * as h from '../../../test/helpers-parse.js';



export class ASTNodeConstant extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeConstant {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeConstant);
		return expression;
	}
	private readonly value: SolidObject;
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
		const value: SolidObject = ((start_node: TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString | TOKEN.TokenTemplate) => (
			(start_node instanceof TOKEN.TokenKeyword) ?
				(start_node.source === Keyword.NULL)  ? SolidNull.NULL :
				(start_node.source === Keyword.FALSE) ? SolidBoolean.FALSE :
				(start_node.source === Keyword.TRUE)  ? SolidBoolean.TRUE :
				(() => { throw new Error(`ASTNodeConstant.constructor did not expect the keyword \`${ start_node.source }\`.`); })()
			: (start_node instanceof TOKEN.TokenNumber) ?
				start_node.isFloat
					? new Float64(start_node.cook())
					: new Int16(BigInt(start_node.cook()))
			: (start_node instanceof TOKEN.TokenString, (Dev.supports('literalString-cook')) ? new SolidString(start_node.cook()) : (() => { throw new Error('`literalString-cook` not yet supported.'); })())
		))(('tree' in start_node) ? (
			(isSyntaxNodeType(start_node, 'template_full'))    ? h.tokenTemplateFullFromSource(start_node.text + ';') :
			(isSyntaxNodeType(start_node, 'template_head'))    ? h.tokenTemplateFullFromSource([                           start_node.text.slice(0,                                           -TOKEN.TokenTemplate.DELIM_INTERP_START.length), TOKEN.TokenTemplate.DELIM].join('') + ';') :
			(isSyntaxNodeType(start_node, 'template_middle'))  ? h.tokenTemplateFullFromSource([TOKEN.TokenTemplate.DELIM, start_node.text.slice(TOKEN.TokenTemplate.DELIM_INTERP_END.length, -TOKEN.TokenTemplate.DELIM_INTERP_START.length), TOKEN.TokenTemplate.DELIM].join('') + ';') :
			(isSyntaxNodeType(start_node, 'template_tail'))    ? h.tokenTemplateFullFromSource([TOKEN.TokenTemplate.DELIM, start_node.text.slice(TOKEN.TokenTemplate.DELIM_INTERP_END.length                                                )                           ].join('') + ';') :
			(isSyntaxNodeType(start_node, 'integer'))          ? h.tokenLiteralFromSource(start_node.text + ';') :
			(isSyntaxNodeType(start_node, 'primitive_literal'),  h.tokenLiteralFromSource(start_node.children[0].text + ';'))
		) : start_node);
		super(start_node, {value})
		this.value = value
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
