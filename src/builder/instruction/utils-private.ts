import type binaryen from 'binaryen';



export function throwUnsupportedType(binType: binaryen.Type): never {
	throw new TypeError(`Type \`${ binType }\` not supported.`);
}
