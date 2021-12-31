import {
	Util,
	TemplatePosition,
	maybe,
	Token,
	TOKEN,
	Terminal,
} from './package.js';



export abstract class TerminalTemplate extends Terminal {
	private static forbidden(): string { return Util.randomChar('\' { \u0003'.split(' ')) }
	private static charsEndDelim(): string {
		const random: number = Math.random()
		return (
			random < 1/3 ? TerminalTemplate.charsEndDelimBasic()      :
			random < 2/3 ? TerminalTemplate.charsEndDelimStartDelim() :
			               TerminalTemplate.charsEndDelimStartInterp()
		)
	}
	private static charsEndDelimBasic(): string {
		return [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndDelim)].join('');
	}
	private static charsEndDelimStartDelim(): string {
		const random: number = Math.random()
		return (
			random < 1/4 ? [`'`,                                   TerminalTemplate.charsEndDelimBasic()                                              ] :
			random < 2/4 ? [`''`,                                  TerminalTemplate.charsEndDelimBasic()                                              ] :
			random < 3/4 ? [`'{`,  maybe(() => Util.randomBool() ? TerminalTemplate.charsEndDelimBasic() : TerminalTemplate.charsEndDelimStartDelim())] :
			               [`''{`, maybe(() => Util.randomBool() ? TerminalTemplate.charsEndDelimBasic() : TerminalTemplate.charsEndDelimStartDelim())]
		).join('')
	}
	private static charsEndDelimStartInterp(): string {
		const random: number = Math.random()
		return (
			random < 1/3 ? [`{`,   maybe(TerminalTemplate.charsEndDelimBasic)                                                             ] :
			random < 2/3 ? [`{'`,  Util.randomBool() ? TerminalTemplate.charsEndDelimBasic() : TerminalTemplate.charsEndDelimStartInterp()] :
			               [`{''`, Util.randomBool() ? TerminalTemplate.charsEndDelimBasic() : TerminalTemplate.charsEndDelimStartInterp()]
		).join('')
	}
	private static charsEndInterp(): string {
		const random: number = Math.random()
		return (
			random < 1/3 ? TerminalTemplate.charsEndInterpBasic() :
			random < 2/3 ? TerminalTemplate.charsEndInterpStartDelim() :
			               TerminalTemplate.charsEndInterpStartInterp()
		)
	}
	private static charsEndInterpBasic(): string {
		return [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndInterp)].join('');
	}
	private static charsEndInterpStartDelim(): string {
		const random: number = Math.random()
		return (
			random < 1/4 ? [`'`,   maybe(TerminalTemplate.charsEndInterpBasic)] :
			random < 2/4 ? [`''`,  maybe(TerminalTemplate.charsEndInterpBasic)] :
			random < 3/4 ? [`'{`,  Util.randomBool() ? TerminalTemplate.charsEndInterpBasic() : TerminalTemplate.charsEndInterpStartDelim()] :
			               [`''{`, Util.randomBool() ? TerminalTemplate.charsEndInterpBasic() : TerminalTemplate.charsEndInterpStartDelim()]
		).join('')
	}
	private static charsEndInterpStartInterp(): string {
		const random: number = Math.random()
		return (
			random < 1/3 ? [`{`,                                   TerminalTemplate.charsEndInterpBasic()                                                ] :
			random < 2/3 ? [`{'`,  maybe(() => Util.randomBool() ? TerminalTemplate.charsEndInterpBasic() : TerminalTemplate.charsEndInterpStartInterp())] :
			               [`{''`, maybe(() => Util.randomBool() ? TerminalTemplate.charsEndInterpBasic() : TerminalTemplate.charsEndInterpStartInterp())]
		).join('')
	}
	random(start: string = TOKEN.TokenTemplate.DELIM, end: string = TOKEN.TokenTemplate.DELIM): string {
		return [start, maybe(end === TOKEN.TokenTemplate.DELIM ? TerminalTemplate.charsEndDelim : TerminalTemplate.charsEndInterp), end].join('')
	}
	match(candidate: Token, position: TemplatePosition = TemplatePosition.FULL): boolean {
		return candidate instanceof TOKEN.TokenTemplate && candidate.position === position
	}
}
