import type {TYPE} from '../typer/index.ts';
import type {IR} from './index.ts';



export type Temp = {
	readonly id:    bigint,
	readonly name:  string,
	readonly type:  TYPE.Type,
	readonly value: IR.Value,
};
