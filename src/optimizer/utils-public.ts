import type {IR} from './index.ts';



export type Local = {
	readonly name: string,
	readonly type: IR.Type,
};
