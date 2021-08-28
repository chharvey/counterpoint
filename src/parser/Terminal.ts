import type {
	Token,
} from '@chharvey/parser';
import {
	TemplatePosition,
} from './utils.js';
import * as TOKEN from './token/index.js';
import {TerminalTemplate} from './terminal/TerminalTemplate.js';



export * from './terminal/index.js';



export class TerminalTemplateTail extends TerminalTemplate {
	static readonly instance: TerminalTemplateTail = new TerminalTemplateTail()
	override random(): string {
		return super.random(TOKEN.TokenTemplate.DELIM_INTERP_END, TOKEN.TokenTemplate.DELIM)
	}
	override match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.TAIL)
	}
}
