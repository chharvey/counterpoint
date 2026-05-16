import type * as binaryen from 'binaryen.ts';



export type Field = {
	type:       binaryen.Type,
	packedType: binaryen.Type,
	mutable:    boolean,
};
