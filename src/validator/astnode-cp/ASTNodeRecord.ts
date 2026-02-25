import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	type Optimizer,
	IR,
	build_record_like,
	AssignmentErrorDuplicateKey,
	TypeErrorNotAssignable,
} from '../../index.ts';
import {
	type NonemptyArray,
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {EntryType} from '../../typer/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeKey} from './ASTNodeKey.ts';
import type {ASTNodeProperty} from './ASTNodeProperty.ts';
import {
	buildDeco,
	typeDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';
import {
	assignToDeco,
	ASTNodeCollectionLiteral,
} from './ASTNodeCollectionLiteral.ts';



export class ASTNodeRecord extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeRecord {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeRecord);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'record_literal'>,
		public override readonly children: Readonly<NonemptyArray<ASTNodeProperty>>,
	) {
		super(start_node, children);
	}

	public override varCheck(): void {
		const keys: ASTNodeKey[] = this.children.map((prop) => prop.key);
		xjs.Array.forEachAggregated(keys, (key, i) => {
			key.varCheck();
			if (keys.slice(0, i).find((k) => k.id === key.id)) {
				throw new AssignmentErrorDuplicateKey(key);
			}
		});
		return xjs.Array.forEachAggregated(this.children, (prop) => prop.val.varCheck());
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		return build_record_like(this.builder, this.children.map((prop) => {
			const value_build: binaryen.ExpressionRef = prop.val.build();
			return {key: prop.key.id, pair: [value_build, binaryen.getExpressionType(value_build)]};
		}));
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		return TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>(this.children.map((c) => [
			c.key.id,
			c.val.type(),
		])));
	}

	@memoizeMethod
	public override lower(optimizer: Optimizer): IR.Value {
		const typ: TYPE.Type = this.type();
		return new IR.RecordNew(this.children.map((c) => [c.key, c.val.lower(optimizer)]), typ, optimizer);
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const properties: ReadonlyMap<bigint, VALUE.Value | null> = new Map(this.children.map((c) => [
			c.key.id,
			c.val.fold(),
		]));
		return ([...properties].map((p) => p[1]).includes(null))
			? null
			: new VALUE.Record(properties as ReadonlyMap<bigint, VALUE.Value>);
	}

	@assignToDeco
	public override assignTo(assignee: TYPE.Type): void {
		const err = new TypeErrorNotAssignable(this.type(), assignee, this);
		if (assignee instanceof TYPE.Record) {
			if (this.children.length < assignee.minCount) {
				throw err;
			}
			assignee.typeargs.forEach((entry, key) => { // using `Array#forEach` instead of `xjs.Array.forEach` to short-circuit
				/* NOTE: We *cannot* assert the property exists since properties are not ordered.
					We can however make the assertion in tuples because of item ordering. */
				if (!entry.optional && !this.children.find((prop) => prop.key.id === key)) {
					throw err;
				}
			});
			return xjs.Array.forEachAggregated(this.children, (prop) => {
				const thattype: EntryType | undefined = assignee.typeargs.get(prop.key.id);
				if (thattype) {
					return ASTNodeCP.typeCheckAssign(prop.val, thattype.type, prop);
				}
			});
		}
		throw err;
	}
}
