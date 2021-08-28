import type {
	Token,
} from '@chharvey/parser';
import {
	TemplatePosition,
	TOKEN,
} from './package.js';
import {TerminalTemplate} from './TerminalTemplate.js';



export class TerminalTemplateMiddle extends TerminalTemplate {
	static readonly instance: TerminalTemplateMiddle = new TerminalTemplateMiddle()
	override random(): string {
		return super.random(TOKEN.TokenTemplate.DELIM_INTERP_END, TOKEN.TokenTemplate.DELIM_INTERP_START)
	}
	override match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.MIDDLE)
	}
}
