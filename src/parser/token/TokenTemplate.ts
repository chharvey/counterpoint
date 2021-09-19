import type {
	NonemptyArray,
	Char,
} from '@chharvey/parser';
import utf8 from 'utf8';
import type {
	CodeUnit,
	TemplatePosition,
} from './package.js';
import {TokenSolid} from './TokenSolid.js';



export class TokenTemplate extends TokenSolid {
	static readonly DELIM              : '\'\'\'' = '\'\'\''
	static readonly DELIM_INTERP_START : '{{' = '{{'
	static readonly DELIM_INTERP_END   : '}}' = '}}'
	constructor (
		private readonly delim_start: typeof TokenTemplate.DELIM | typeof TokenTemplate.DELIM_INTERP_END,
		private readonly delim_end:   typeof TokenTemplate.DELIM | typeof TokenTemplate.DELIM_INTERP_START,
		readonly position: TemplatePosition,
		...chars: NonemptyArray<Char>
	) {
		super('TEMPLATE', ...chars);
	}
	cook(): CodeUnit[] {
		return [...utf8.encode(
			this.source.slice(this.delim_start.length, -this.delim_end.length),
		)].map((ch) => ch.codePointAt(0)!);
	}
}
