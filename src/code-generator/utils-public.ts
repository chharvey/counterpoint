import type binaryen from 'binaryen';
import type {Builder} from '../index.ts';
import {BinValue} from './BinValue.ts';



export function Property_new(cg: Builder, id: bigint, code: binaryen.ExpressionRef): binaryen.ExpressionRef {
	return cg.module.struct.new([
		cg.module.i32.const(Number(id)),
		new BinValue(cg, code).value,
	], cg.getHeaptype('$Property')!);
}
