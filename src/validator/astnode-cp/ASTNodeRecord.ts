import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
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
import type {TypeEntry} from '../../typer/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeKey} from './ASTNodeKey.ts';
import type {ASTNodeProperty} from './ASTNodeProperty.ts';
import {
	ASTNodeExpression,
	typeDeco,
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
		super.varCheck();
		const keys: ASTNodeKey[] = this.children.map((prop) => prop.key);
		xjs.Array.forEachAggregated(keys.map((key) => key.id), (id, i, ids) => {
			if (ids.slice(0, i).includes(id)) {
				throw new AssignmentErrorDuplicateKey(keys[i]);
			}
		});
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		const props: ReadonlyMap<bigint, TYPE.Type> = new Map<bigint, TYPE.Type>(this.children.map((c) => {
			const valuetype: TYPE.Type = c.val.type();
			return [c.key.id, valuetype];
		}));
		return TYPE.Record.fromTypes(props);
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
			if (this.children.length < assignee.count[0]) {
				throw err;
			}
			assignee.invariants.forEach((entry, key) => { // using `.forEach` to short-circuit
				/* NOTE: We *cannot* assert the property exists since properties are not ordered.
					We can however make the assertion in tuples because of item ordering. */
				if (!entry.optional && !this.children.find((prop) => prop.key.id === key)) {
					throw err;
				}
			});
			return xjs.Array.forEachAggregated(this.children, (prop) => {
				const thattype: TypeEntry | undefined = assignee.invariants.get(prop.key.id);
				if (thattype) {
					return ASTNodeCP.typeCheckAssign(prop.val, thattype.type, prop);
				}
			});
		}
		throw err;
	}
}
