import * as assert from 'assert';
import {
	memoizeMethod,
} from '../../decorators.js';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	SolidType,
	SolidTypeTuple,
	SolidObject,
	SolidTuple,
	INST,
	Builder,
	Validator,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeTuple extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTuple {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeTuple);
		return expression;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTupleLiteral,
		override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, {}, children);
	}
	override shouldFloat(_validator: Validator): boolean {
		throw 'ASTNodeTuple#shouldFloat not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.buildDeco
	override build(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeTuple#build not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(validator: Validator): SolidType {
		return SolidTypeTuple.fromTypes(this.children.map((c) => c.type(validator)));
	}
	@memoizeMethod
	override assess(validator: Validator): SolidObject | null {
		const items: readonly (SolidObject | null)[] = this.children.map((c) => c.assess(validator));
		return (items.includes(null))
			? null
			: new SolidTuple(items as SolidObject[]);
	}
}
