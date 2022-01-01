import {
	Util,
	TemplatePosition,
	maybe,
	choose,
	Token,
	TOKEN,
	Terminal,
} from './package.js';



export abstract class TerminalTemplate extends Terminal {
	private static forbidden(): string { return Util.randomChar('\' { \u0003'.split(' ')) }
	private static charsEndDelim(): string {
		return choose(
			TerminalTemplate.charsEndDelimBasic,
			TerminalTemplate.charsEndDelimStartDelim,
			TerminalTemplate.charsEndDelimStartInterp,
		)
	}
	private static charsEndDelimBasic(): string {
		return [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndDelim)].join('');
	}
	private static charsEndDelimStartDelim(): string {
		return choose(
			() => [Util.arrayRandom([`'`,  `''`]),                     TerminalTemplate.charsEndDelimBasic()                                          ].join(''),
			() => [Util.arrayRandom([`'{`, `''{`]), maybe(() => choose(TerminalTemplate.charsEndDelimBasic, TerminalTemplate.charsEndDelimStartDelim))].join(''),
		);
	}
	private static charsEndDelimStartInterp(): string {
		return choose(
			() => [`{`,                             maybe (TerminalTemplate.charsEndDelimBasic)                                           ].join(''),
			() => [Util.arrayRandom([`{'`, `{''`]), choose(TerminalTemplate.charsEndDelimBasic, TerminalTemplate.charsEndDelimStartInterp)].join(''),
		);
	}
	private static charsEndInterp(): string {
		return choose(
			TerminalTemplate.charsEndInterpBasic,
			TerminalTemplate.charsEndInterpStartDelim,
			TerminalTemplate.charsEndInterpStartInterp,
		)
	}
	private static charsEndInterpBasic(): string {
		return [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndInterp)].join('');
	}
	private static charsEndInterpStartDelim(): string {
		return choose(
			() => [Util.arrayRandom([`'`, `''`]),   maybe (TerminalTemplate.charsEndInterpBasic)].join(''),
			() => [Util.arrayRandom([`'{`, `''{`]), choose(TerminalTemplate.charsEndInterpBasic, TerminalTemplate.charsEndInterpStartDelim)].join(''),
		);
	}
	private static charsEndInterpStartInterp(): string {
		return choose(
			() => [`{`,                                                TerminalTemplate.charsEndInterpBasic()                                            ].join(''),
			() => [Util.arrayRandom([`{'`, `{''`]), maybe(() => choose(TerminalTemplate.charsEndInterpBasic, TerminalTemplate.charsEndInterpStartInterp))].join(''),
		);
	}
	random(start: string = TOKEN.TokenTemplate.DELIM, end: string = TOKEN.TokenTemplate.DELIM): string {
		return [start, maybe(end === TOKEN.TokenTemplate.DELIM ? TerminalTemplate.charsEndDelim : TerminalTemplate.charsEndInterp), end].join('')
	}
	match(candidate: Token, position: TemplatePosition = TemplatePosition.FULL): boolean {
		return candidate instanceof TOKEN.TokenTemplate && candidate.position === position
	}
}
