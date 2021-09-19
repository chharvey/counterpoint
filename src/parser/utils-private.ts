import {
	Util,
} from './package.js';



export type RadixType = 2n|4n|8n|10n|16n|36n



export function maybe(fun: () => string): string {
	return Util.randomBool() ? '' : fun.call(null);
}



export function maybeA(fun: () => string[]): string[] {
	return Util.randomBool() ? [] : fun.call(null);
}
