import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	type INST,
	type Builder,
	AssignmentErrorDuplicateKey,
	TypeError,
	TypeErrorUnexpectedRef,
	type TypeErrorNotAssignable,
} from '../../index.js';
import {
	type NonemptyArray,
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeFamily} from '../utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeKey} from './ASTNodeKey.js';
import type {ASTNodeProperty} from './ASTNodeProperty.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeRecord extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeRecord {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeRecord);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'record_literal', ['variable']>,
		public override readonly children: Readonly<NonemptyArray<ASTNodeProperty>>,
		is_ref: boolean,
	) {
		super(start_node, children, is_ref);
	}

	public override shouldFloat(): boolean {
		throw 'ASTNodeRecord#shouldFloat not yet supported.';
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
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): INST.InstructionExpression {
		builder;
		throw 'ASTNodeRecord#build not yet supported.';
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		const props: ReadonlyMap<bigint, TYPE.Type> = new Map<bigint, TYPE.Type>(this.children.map((c) => {
			const valuetype: TYPE.Type = c.val.type();
			if (!this.isRef && valuetype.isReference) {
				throw new TypeErrorUnexpectedRef(valuetype, c);
			}
			return [c.key.id, valuetype];
		}));
		return TYPE.TypeRecord.fromTypes(props);
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const properties: ReadonlyMap<bigint, OBJ.Object | null> = new Map(this.children.map((c) => [
			c.key.id,
			c.val.fold(),
		]));
		return ([...properties].map((p) => p[1]).includes(null))
			? null
			: new OBJ.Record(properties as ReadonlyMap<bigint, OBJ.Object>);
	}

	@ASTNodeCollectionLiteral.assignToDeco
	public override assignTo(assignee: TYPE.Type, err: TypeErrorNotAssignable): void {
		if (assignee instanceof TYPE.TypeRecord) {
			if (this.children.length < assignee.count[0]) {
				throw err;
			}
			try {
				xjs.Array.forEachAggregated([...assignee.invariants], ([id, thattype]) => {
					const prop: ASTNodeProperty | undefined = this.children.find((c) => c.key.id === id);
					if (!thattype.optional && !prop) {
						// TODO: use a more specific class of TypeError used when checking subtypes
						throw new TypeError(`Property \`${ id }\` does not exist on type \`${ this.type() }\`.`, 0, this.line_index, this.col_index);
					}
				});
			} catch (err2) {
				err.cause = err2;
				throw err;
			}
			return xjs.Array.forEachAggregated([...assignee.invariants], ([id, thattype]) => {
				const prop: ASTNodeProperty | undefined = this.children.find((c) => c.key.id === id);
				const expr: ASTNodeExpression | undefined = prop?.val;
				if (expr) {
					return ASTNodeCP.assignExpression(expr, thattype.type, expr);
				}
			});
		}
		throw err;
	}
}
