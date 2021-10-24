import {
	TemplatePosition,
	Token,
	TOKEN,
} from './package.js';
import {TerminalTemplate} from './TerminalTemplate.js';



export class TerminalTemplateTail extends TerminalTemplate {
	static readonly instance: TerminalTemplateTail = new TerminalTemplateTail()
	override random(): string {
		return super.random(TOKEN.TokenTemplate.DELIM_INTERP_END, TOKEN.TokenTemplate.DELIM)
	}
	override match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.TAIL)
	}
}
