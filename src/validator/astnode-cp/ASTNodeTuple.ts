import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	OBJ,
	TYPE,
} from '../../index.js';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeTuple extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTuple {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeTuple);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'tuple_literal'>,
		public override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, children);
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(): binaryen.ExpressionRef {
		return this.builder.module.tuple.make(this.children.flatMap<binaryen.ExpressionRef>((child) => {
			const child_type:  TYPE.Type              = child.type();
			const child_build: binaryen.ExpressionRef = child.build();
			if (child_type instanceof TYPE.TypeTuple) {
				if (!child_type.invariants.length) {
					return [];
				} else if (child_type.invariants.length === 1) {
					return this.builder.module.tuple.extract(child_build, 0);
				} else {
					const bintype:  binaryen.Type            = binaryen.getExpressionType(child_build);
					const expanded: readonly binaryen.Type[] = binaryen.expandType(bintype);
					const temp_id:  bigint                   = this.builder.varCount;
					const local                              = this.builder.addLocal(temp_id, bintype)[0].getLocalInfo(temp_id)!;
					assert.ok(child_type.invariants.length > 1, '`TypeTuple#invariants` should have a non-negative length.');
					assert.ok(expanded             .length > 1, 'Binaryen type array should have > 1 length.');
					return [
						                                   this.builder.module.tuple.extract(this.builder.module.local.tee(local.index, child_build, local.type), 0),
						...expanded.slice(1).map((_, i) => this.builder.module.tuple.extract(this.builder.module.local.get(local.index,              local.type), i + 1)),
					];
				}
			} else {
				return child_build;
			}
		}));
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		return TYPE.TypeTuple.fromTypes(this.children.map((c) => c.type()));
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const items: readonly (OBJ.Object | null)[] = this.children.map((c) => c.fold());
		return (items.includes(null))
			? null
			: new OBJ.Tuple(items as OBJ.Object[]);
	}
}
