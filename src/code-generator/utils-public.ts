import type binaryen from 'binaryen';
import type {Builder} from '../index.ts';



export function Property_new(cg: Builder, id: bigint, code: binaryen.ExpressionRef): binaryen.ExpressionRef {
	return cg.module.struct.new([
		cg.module.i32.const(Number(id)),
		code,
	], cg.getHeaptype('$Property')!);
}
