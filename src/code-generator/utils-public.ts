import binaryen from 'binaryen';
import {
	bigint_to_i64,
	type Builder,
} from '../index.ts';
import type {Field} from '../builder/-types.d.ts';



export function Field_new(typ: binaryen.Type, packedType: 'notPacked' | 'i8' | 'i16' = 'notPacked', mutable: boolean = false): Field {
	return {
		type:       typ,
		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		// eslint-disable-next-line
		packedType: binaryen[packedType],
		mutable,
	};
}



export function Value_new(cg: Builder, code: binaryen.ExpressionRef): binaryen.ExpressionRef {
	const t_value: binaryen.Type = cg.typeRegistry.get('Value')!;
	return binaryen.getExpressionType(code) === binaryen.v128
		? cg.module.struct.new([
			cg.module.i32.const(0),
			code,
			cg.module.ref.null(binaryen.eqref),
		], t_value)
		: cg.module.struct.new([
			cg.module.i32.const(1),
			cg.module.v128.const(new Uint8Array(16)),
			code,
		], t_value);
}



export function DictEntry_new(cg: Builder, id: bigint, code: binaryen.ExpressionRef): binaryen.ExpressionRef {
	return cg.module.struct.new([
		bigint_to_i64(cg.module, id),
		Value_new(cg, code),
	], cg.typeRegistry.get('DictEntry')!);
}
