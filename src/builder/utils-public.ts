import * as binaryen from 'binaryen.ts';
import type {VirtualMachine} from '../vm/index.ts';



/**
 * Return a block containing `(drop)` expressions for each of `args`, followed by a final expression.
 * If `final` is provided as an ExpressionRef, it is the final expression;
 * otherwise, a v128 containing a boolean encoding is the final expression.
 * @param vm
 * @param args  the args to drop first
 * @param final the final expression/statement
 */
export function drop_then(
	vm:    VirtualMachine,
	args:  readonly binaryen.ExpressionRef[],
	final: binaryen.ExpressionRef | boolean,
): binaryen.ExpressionRef {
	const last_item: binaryen.ExpressionRef = typeof final === 'number' ? final : final ? vm.Vect.TRUE : vm.Vect.FALSE;
	return vm.mod.wasm.block(null, [...args.map((arg) => vm.mod.wasm.drop(arg)), last_item], binaryen.getExpressionType(last_item));
}
