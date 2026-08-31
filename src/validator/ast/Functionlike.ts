import type {AstNode} from './AstNode.ts';
import type {ParameterFunction} from './ParameterFunction.ts';
import type {Block} from './Block.ts';
import type * as AST_TYPE from './type/index.ts';
import * as EXPR from './expression/index.ts';
import * as STMT from './statement/index.ts';



/**
 * Known implementers:
 * - EXPR.Function
 * - STMT.DeclarationFunction
 */
export interface Functionlike extends AstNode {
	readonly parameters: readonly ParameterFunction[];
	readonly returnType: AST_TYPE.Type | null;
	readonly block:      Block;
}



export function is_Functionlike(node: AstNode): node is Functionlike {
	return node instanceof EXPR.Function || node instanceof STMT.DeclarationFunction;
}
