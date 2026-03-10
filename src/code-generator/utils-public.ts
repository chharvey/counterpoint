import binaryen from 'binaryen';
import type {Builder} from '../builder/index.ts';
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
	const value_t: binaryen.Type = cg.typeRegistry.get('Value')!;
	return binaryen.getExpressionType(code) === binaryen.v128
		? cg.module.struct.new([
			cg.module.i32.const(0),
			code,
			cg.module.ref.null(binaryen.eqref),
		], value_t)
		: cg.module.struct.new([
			cg.module.i32.const(1),
			cg.module.v128.const(new Uint8Array(16)),
			code,
		], value_t);
}



export function DictEntry_new(cg: Builder, id: bigint, code: binaryen.ExpressionRef): binaryen.ExpressionRef {
	const dict_entry_t: binaryen.Type = cg.typeRegistry.get('DictEntry')!;
	return binaryen.getExpressionType(code) === binaryen.v128
		? cg.module.struct.new([
			cg.module.i64.const(Number(id), 0), // TODO: v0.5: use `bigint_to_i64`
			cg.module.i32.const(0),
			code,
			cg.module.ref.null(binaryen.eqref),
		], dict_entry_t)
		: cg.module.struct.new([
			cg.module.i64.const(Number(id), 0), // TODO: v0.5: use `bigint_to_i64`
			cg.module.i32.const(1),
			cg.module.v128.const(new Uint8Array(16)),
			code,
		], dict_entry_t);
}
