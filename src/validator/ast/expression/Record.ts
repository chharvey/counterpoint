import * as xjs from 'extrajs';
import {
	type Builder,
	OP,
	AssignmentErrorDuplicateKey,
	TypeErrorNotAssignable,
} from '../../../index.ts';
import {
	type NonemptyArray,
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {
	type EntryType,
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import {typecheck_assign} from '../AstNode.ts';
import type {Key} from '../Key.ts';
import type {Property} from '../Property.ts';
import {Expression} from './Expression.ts';
import {
	assignToDeco,
	Collection,
} from './Collection.ts';



class ExpressionRecord extends Collection {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ExpressionRecord {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, ExpressionRecord);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'expression_record_literal', ['break']>,
		public override readonly children: Readonly<NonemptyArray<Property>>,
	) {
		super(start_node, children);
	}

	public override varCheck(): void {
		const keys: Key[] = this.children.map((prop) => prop.key);
		xjs.Array.forEachAggregated(keys, (key, i) => {
			key.varCheck();
			if (keys.slice(0, i).find((k) => k.id === key.id)) {
				throw new AssignmentErrorDuplicateKey(key);
			}
		});
		return xjs.Array.forEachAggregated(this.children, (prop) => prop.val.varCheck());
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		if (this.children.some((c) => c.val.type().isBottomType)) {
			return TYPE.NOTHING;
		}
		return TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>(this.children.map((c) => [
			c.key.id,
			c.val.type(),
		])));
	}

	@memoizeMethod
	public override build(builder: Builder): OP.RecordNew {
		return new OP.RecordNew(new Map(this.children.map((c) => ([
			c.key.id,
			{keysrc: c.key.source, value: c.val.build(builder).asTac(builder)},
		]))), this.type());
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
		const err = new TypeErrorNotAssignable(this, assignee);
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
					return typecheck_assign(prop.val, thattype.type, prop);
				}
			});
		}
		throw err;
	}
}
export {ExpressionRecord as Record};
