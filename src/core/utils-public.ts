import {Filebound} from './utils-private.js';



/**
 * Return a map of key-value pairs as a string of XML attributes.
 *
 * For example, given the map `[[key0, value0],  [key1, value1]]`,
 * this method returns the string `key0="value0" key1="value1"`.
 * @param   attributes a map of key-value pairs
 * @returns            an XML string of space-separated attributes
 */
export function stringifyAttributes(attributes: ReadonlyMap<string, string>): string {
	return [...attributes].map(([attr, val]) => `${ attr }="${ val
		.replace(/&/g,  '&amp;')
		.replace(/</g,  '&lt;')
		.replace(/>/g,  '&gt;')
		.replace(/'/g,  '&apos;')
		.replace(/"/g,  '&quot;')
		.replace(/\\/g, '&#x5c;')
		.replace(/\t/g, '&#x09;')
		.replace(/\n/g, '&#x0a;')
		.replace(/\r/g, '&#x0d;')
		.replace(Filebound.SOT, '\u2402') // SYMBOL FOR START OF TEXT
		.replace(Filebound.EOT, '\u2403') // SYMBOL FOR END   OF TEXT
		.replace(/[^\u0020-\u007e\u2402-\u2403]/g, (match) => `&#x${ match.codePointAt(0)!.toString(16) };`)
	}"`).join(' ');
}
