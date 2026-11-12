import * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';



/**
 * Return a block containing `(drop)` expressions for each of `args`, followed by a final expression.
 * If `final` is provided as an ExpressionRef, it is the final expression;
 * otherwise, a v128 containing a boolean encoding is the final expression.
 * @param cg
 * @param args  the args to drop first
 * @param final the final expression/statement
 * @deprecated
 */
export function drop_then(
	cg:    CodeGenerator,
	args:  readonly binaryen.ExpressionRef[],
	final: binaryen.ExpressionRef | boolean,
): binaryen.ExpressionRef {
	const last_item: binaryen.ExpressionRef = typeof final === 'number' ? final : final ? cg.vm.Value.TRUE : cg.vm.Value.FALSE;
	return cg.mod.wasm.block(null, [...args.map((arg) => cg.mod.wasm.drop(arg)), last_item], binaryen.getExpressionType(last_item));
}
