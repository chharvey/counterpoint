import * as assert from 'assert';
import {
	memoizeMethod,
} from '../../decorators.js';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	SolidType,
	SolidTypeSet,
	SolidObject,
	SolidSet,
	INST,
	Builder,
	Validator,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeSet extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeSet {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeSet);
		return expression;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTupleLiteral,
		override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, {}, children);
	}
	override shouldFloat(_validator: Validator): boolean {
		throw 'ASTNodeSet#shouldFloat not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.buildDeco
	override build(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeSet#build_do not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(validator: Validator): SolidType {
		return new SolidTypeSet(
			(this.children.length)
				? SolidType.unionAll(this.children.map((c) => c.type(validator)))
				: SolidType.NEVER,
		);
	}
	@memoizeMethod
	override assess(validator: Validator): SolidObject | null {
		const elements: readonly (SolidObject | null)[] = this.children.map((c) => c.assess(validator));
		return (elements.includes(null))
			? null
			: new SolidSet(new Set(elements as SolidObject[]));
	}
}
