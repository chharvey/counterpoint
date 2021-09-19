import type {
	Token,
} from '@chharvey/parser';
import {
	TemplatePosition,
	TOKEN,
} from './package.js';
import {TerminalTemplate} from './TerminalTemplate.js';



export class TerminalTemplateFull extends TerminalTemplate {
	static readonly instance: TerminalTemplateFull = new TerminalTemplateFull()
	override random(): string {
		return super.random(TOKEN.TokenTemplate.DELIM, TOKEN.TokenTemplate.DELIM)
	}
	override match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.FULL)
	}
}
