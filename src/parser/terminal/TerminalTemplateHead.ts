import {
	TemplatePosition,
	Token,
	TOKEN,
} from './package.js';
import {TerminalTemplate} from './TerminalTemplate.js';



export class TerminalTemplateHead extends TerminalTemplate {
	static readonly instance: TerminalTemplateHead = new TerminalTemplateHead()
	override random(): string {
		return super.random(TOKEN.TokenTemplate.DELIM, TOKEN.TokenTemplate.DELIM_INTERP_START)
	}
	override match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.HEAD)
	}
}
