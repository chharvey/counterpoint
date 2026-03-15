import binaryen from 'binaryen';
import type {Builder} from '../index.ts';



export function Value_new(cg: Builder, code: binaryen.ExpressionRef): binaryen.ExpressionRef {
	const ht_value: binaryen.Type = cg.getHeaptype('$Value')!;
	return binaryen.getExpressionType(code) === binaryen.v128
		? cg.module.struct.new([
			cg.module.i32.const(0),
			code,
			cg.module.ref.null(binaryen.eqref),
		], ht_value)
		: cg.module.struct.new([
			cg.module.i32.const(1),
			cg.module.v128.const(new Uint8Array(16)),
			code,
		], ht_value);
}



export function Property_new(cg: Builder, id: bigint, code: binaryen.ExpressionRef): binaryen.ExpressionRef {
	return cg.module.struct.new([
		cg.module.i32.const(Number(id)),
		Value_new(cg, code),
	], cg.getHeaptype('$Property')!);
}
