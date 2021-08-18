import type {NonemptyArray} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
} from '../core/index.js';
import type {PARSER} from '../parser/index.js';
import {
	SolidType,
	SolidTypeRecord,
	SolidObject,
	SolidRecord,
} from '../typer/index.js';
import type {
	Builder,
	INST,
} from '../builder/index.js';
import type {ASTNodeProperty} from './ASTNodeProperty.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import type {Validator} from './Validator.js';



export class ASTNodeRecord extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeRecord {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeRecord);
		return expression;
	}
	constructor (
		start_node: PARSER.ParseNodeRecordLiteral,
		override readonly children: Readonly<NonemptyArray<ASTNodeProperty>>,
	) {
		super(start_node, {}, children);
	}
	override shouldFloat(_validator: Validator): boolean {
		throw 'ASTNodeRecord#shouldFloat not yet supported.';
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeRecord#build_do not yet supported.';
	}
	protected override type_do(validator: Validator): SolidType {
		return SolidTypeRecord.fromTypes(new Map(this.children.map((c) => [
			c.key.id,
			c.value.type(validator),
		])));
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const properties: ReadonlyMap<bigint, SolidObject | null> = new Map(this.children.map((c) => [
			c.key.id,
			c.value.assess(validator),
		]));
		return ([...properties].map((p) => p[1]).includes(null))
			? null
			: new SolidRecord(properties as ReadonlyMap<bigint, SolidObject>);
	}
}
