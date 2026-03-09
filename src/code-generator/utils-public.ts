import binaryen from 'binaryen';
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
