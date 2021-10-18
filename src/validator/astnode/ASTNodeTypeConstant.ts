import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
	Keyword,
	TOKEN,
	SolidType,
	SolidTypeUnit,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
	Validator,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeConstant extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeConstant {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeConstant);
		return typ;
	}
	private readonly type: SolidType;
	constructor (start_node: TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString) {
		const value: SolidType = (
			(start_node instanceof TOKEN.TokenKeyword) ?
				(start_node.source === Keyword.VOID)  ? SolidType.VOID :
				(start_node.source === Keyword.NULL)  ? SolidType.NULL :
				(start_node.source === Keyword.BOOL)  ? SolidType.BOOL :
				(start_node.source === Keyword.FALSE) ? SolidBoolean.FALSETYPE :
				(start_node.source === Keyword.TRUE ) ? SolidBoolean.TRUETYPE :
				(start_node.source === Keyword.INT)   ? SolidType.INT :
				(start_node.source === Keyword.FLOAT) ? SolidType.FLOAT :
				(start_node.source === Keyword.STR)   ? SolidType.STR :
				(start_node.source === Keyword.OBJ)   ? SolidType.OBJ :
				(() => { throw new Error(`ASTNodeTypeConstant.constructor did not expect the keyword \`${ start_node.source }\`.`); })()
			: (start_node instanceof TOKEN.TokenNumber) ?
				new SolidTypeUnit(
					start_node.isFloat
						? new Float64(start_node.cook())
						: new Int16(BigInt(start_node.cook()))
				)
			: /* (start_node instanceof TOKEN.TokenString) */ (Dev.supports('literalString-cook')) ? new SolidTypeUnit(new SolidString(start_node.cook())) : (() => { throw new Error('`literalString-cook` not yet supported.'); })()
		);
		super(start_node, {value});
		this.type = value;
	}
	protected override eval_do(_validator: Validator): SolidType {
		return this.type;
	}
}
