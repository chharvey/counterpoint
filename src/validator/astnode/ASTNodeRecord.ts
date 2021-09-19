import type {NonemptyArray} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidType,
	SolidTypeRecord,
	SolidObject,
	SolidRecord,
	INST,
	Builder,
	memoizeMethod,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	Validator,
} from './package.js';
import type {ASTNodeProperty} from './ASTNodeProperty.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeRecord extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeRecord {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeRecord);
		return expression;
	}
	constructor (
		start_node: PARSENODE.ParseNodeRecordLiteral,
		override readonly children: Readonly<NonemptyArray<ASTNodeProperty>>,
	) {
		super(start_node, {}, children);
	}
	override shouldFloat(_validator: Validator): boolean {
		throw 'ASTNodeRecord#shouldFloat not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.buildDeco
	override build(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeRecord#build not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(validator: Validator): SolidType {
		return SolidTypeRecord.fromTypes(new Map(this.children.map((c) => [
			c.key.id,
			c.value.type(validator),
		])));
	}
	@memoizeMethod
	override assess(validator: Validator): SolidObject | null {
		const properties: ReadonlyMap<bigint, SolidObject | null> = new Map(this.children.map((c) => [
			c.key.id,
			c.value.assess(validator),
		]));
		return ([...properties].map((p) => p[1]).includes(null))
			? null
			: new SolidRecord(properties as ReadonlyMap<bigint, SolidObject>);
	}
}
