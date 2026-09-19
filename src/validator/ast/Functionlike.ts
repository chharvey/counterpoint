import * as xjs from 'extrajs';
import {AssignmentErrorDuplicateKey} from '../../index.ts';
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



/**
 * Default implementation of `Functionlike#varCheck`.
 */
export function Functionlike_varCheck(this: Functionlike): void {
	xjs.Array.forEachAggregated(this.parameters, (param) => param.varCheck());

	// ensure no duplicate parameter keys
	const key_ids = new Set<bigint>();
	xjs.Array.forEachAggregated(this.parameters, (param) => {
		const key_id: bigint | undefined = param.labelId;
		if (key_id !== undefined) {
			if (key_ids.has(key_id)) {
				throw new AssignmentErrorDuplicateKey(param.key ?? param.identifier!);
			} else {
				key_ids.add(key_id);
			}
		}
	});

	this.returnType?.varCheck();
	return this.block.varCheck();
}
