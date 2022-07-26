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
	memoizeMethod,
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
	Keyword,
	TOKEN,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeConstant extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeConstant {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeConstant);
		return expression;
	}
	private readonly value: SolidObject;
	constructor (start_node: TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString | TOKEN.TokenTemplate) {
		const value: SolidObject = (
			(start_node instanceof TOKEN.TokenKeyword) ?
				(start_node.source === Keyword.NULL)  ? SolidNull.NULL :
				(start_node.source === Keyword.FALSE) ? SolidBoolean.FALSE :
				(start_node.source === Keyword.TRUE)  ? SolidBoolean.TRUE :
				(() => { throw new Error(`ASTNodeConstant.constructor did not expect the keyword \`${ start_node.source }\`.`); })()
			: (start_node instanceof TOKEN.TokenNumber) ?
				start_node.isFloat
					? new Float64(start_node.cook())
					: new Int16(BigInt(start_node.cook()))
			: /* (start_node instanceof TOKEN.TokenString) */ (Dev.supports('literalString-cook')) ? new SolidString(start_node.cook()) : (() => { throw new Error('`literalString-cook` not yet supported.'); })()
		);
		super(start_node, {value})
		this.value = value
	}
	override shouldFloat(): boolean {
		return this.value instanceof Float64
	}
	@memoizeMethod
	@ASTNodeExpression.buildDeco
	override build(_builder: Builder, to_float: boolean = false): INST.InstructionConst {
		return INST.InstructionConst.fromCPValue(this.fold(), to_float);
	}
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(): SolidType {
		return new SolidTypeUnit(this.value);
	}
	@memoizeMethod
	override fold(): SolidObject {
		if (this.value instanceof SolidString && !Dev.supports('stringConstant-assess')) {
			throw new Error('`stringConstant-assess` not yet supported.');
		};
		return this.value;
	}
}
