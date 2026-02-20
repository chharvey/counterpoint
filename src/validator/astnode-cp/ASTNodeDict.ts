import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	type CFG,
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
import type {SyntaxNodeType} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeKey} from './ASTNodeKey.ts';
import type {ASTNodeProperty} from './ASTNodeProperty.ts';
import {
	lowerDeco,
	buildDeco,
	typeDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';
import {
	assignToDeco,
	ASTNodeCollectionLiteral,
} from './ASTNodeCollectionLiteral.ts';



export class ASTNodeDict extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDict {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeDict);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'dict_literal'>,
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
	@lowerDeco
	public lower(): CFG.CfgNode {
		throw new Error('`ASTNodeDict#lower` not yet supported.');
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('`ASTNodeDict#build` not yet supported.');
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		return new TYPE.Dict(
			TYPE.Union.all(this.children.map((c) => c.val.type())),
			true,
		);
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const properties: ReadonlyMap<bigint, VALUE.Value | null> = new Map(this.children.map((c) => [
			c.key.id,
			c.val.fold(),
		]));
		return [...properties].map((p) => p[1]).includes(null)
			? null
			: new VALUE.Dict(properties as ReadonlyMap<bigint, VALUE.Value>);
	}

	@assignToDeco
	public override assignTo(assignee: TYPE.Type): void {
		if (assignee instanceof TYPE.Dict) {
			// better error reporting to check entry-by-entry instead of checking `this.type().typearg`
			return xjs.Array.forEachAggregated(this.children, (prop) => ASTNodeCP.typeCheckAssign(prop.val, assignee.typearg, prop));
		}
		throw new TypeErrorNotAssignable(this.type(), assignee, this);
	}
}
