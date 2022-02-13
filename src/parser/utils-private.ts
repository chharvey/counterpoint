import {Filebound} from './utils-public.js';



/**
 * Transform `TitleCase` into `MACRO_CASE`.
 * @param   s the string to transform, in `AbcDef` format
 * @returns   the string in `ABC_DEF` format
 */
export function titleToMacro(s: string): string {
	return s.replace(/[A-Z]/g, '_$&').slice(1).toUpperCase();
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
