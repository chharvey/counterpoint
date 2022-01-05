import {
	NonemptyArray,
	Util,
} from './package.js';
import {Filebound} from './utils-public.js';
import type {Terminal} from './Terminal.js';
import type {Production} from './Production.js';



export type RadixType = 2n|4n|8n|10n|16n|36n



export type GrammarTerminal =
	| string
	| Terminal
;



export type GrammarSymbol =
	| GrammarTerminal
	| Production
;



/**
 * Transform `TitleCase` into `MACRO_CASE`.
 * @param   s the string to transform, in `AbcDef` format
 * @returns   the string in `ABC_DEF` format
 */
export function titleToMacro(s: string): string {
	return s.replace(/[A-Z]/g, '_$&').slice(1).toUpperCase();
}



/**
 * Transform `MACRO_CASE` into `TitleCase`.
 * @param   s the string to transform, in `ABC_DEF` format
 * @returns   the string in `AbcDef` format
 */
export function macroToTitle(s: string): string {
	return s.split('_').map((ss) => ss[0].concat(ss.slice(1).toLowerCase())).join('');
}



export function maybe(fun: () => string): string {
	return Util.randomBool() ? '' : fun.call(null);
}

export function choose(...funs: Readonly<NonemptyArray<() => string>>): string {
	return Util.arrayRandom(funs).call(null);
}




/**
 * Sanitize a string for the text content of an XML element.
 * @param   contents the original element contents
 * @returns          contents with XML special characters escaped
 */
export function sanitizeContent(contents: string): string {
	return contents
		.replace(/\&/g, '&amp;' )
		.replace(/\</g, '&lt;'  )
		.replace(/\>/g, '&gt;'  )
		.replace(/\\/g, '&#x5c;')
		.replace(Filebound.SOT, '\u2402') // SYMBOL FOR START OF TEXT
		.replace(Filebound.EOT, '\u2403') // SYMBOL FOR END   OF TEXT
	;
}



/**
 * Display a string of grammar symbols for debugging purposes.
 *
 * @param   arr the array of grammar symbols
 * @returns     a string representing the sequence of those symbols
 */
export function stringOfSymbols(arr: readonly GrammarSymbol[]): string {
	return arr.map((symbol) => (typeof symbol === 'string')
		? `"${ symbol }"`
			.replace(Filebound.SOT, '\u2402') // SYMBOL FOR START OF TEXT
			.replace(Filebound.EOT, '\u2403') // SYMBOL FOR END   OF TEXT
		: symbol.displayName
	).join(' ');
}
