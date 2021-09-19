import {
	Token,
	Terminal,
} from '@chharvey/parser';
import {
	Util,
	TemplatePosition,
	maybe,
	maybeA,
	TOKEN,
} from './package.js';



export abstract class TerminalTemplate extends Terminal {
	private static forbidden(): string { return Util.randomChar('\' { \u0003'.split(' ')) }
	private static charsEndDelim(): string {
		const random: number = Math.random()
		return (
			random < 1/3 ? [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndDelim)].join('') :
			random < 2/3 ? TerminalTemplate.charsEndDelimStartDelim() :
			               TerminalTemplate.charsEndDelimStartInterp()
		)
	}
	private static charsEndDelimStartDelim(): string {
		const random: number = Math.random()
		return (
			random < 1/4 ? [`'`,                                                 TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndDelim)                                                 ] :
			random < 2/4 ? [`''`,                                                TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndDelim)                                                 ] :
			random < 3/4 ? [`'{`,  ...maybeA(() => Util.randomBool() ? [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndDelim)] : [TerminalTemplate.charsEndDelimStartDelim()])] :
			               [`''{`, ...maybeA(() => Util.randomBool() ? [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndDelim)] : [TerminalTemplate.charsEndDelimStartDelim()])]
		).join('')
	}
	private static charsEndDelimStartInterp(): string {
		const random: number = Math.random()
		return (
			random < 1/3 ? [`{`,   ...(Util.randomBool() ? [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndDelim)] : [''                                         ])] :
			random < 2/3 ? [`{'`,  ...(Util.randomBool() ? [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndDelim)] : [TerminalTemplate.charsEndDelimStartInterp()])] :
			               [`{''`, ...(Util.randomBool() ? [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndDelim)] : [TerminalTemplate.charsEndDelimStartInterp()])]
		).join('')
	}
	private static charsEndInterp(): string {
		const random: number = Math.random()
		return (
			random < 1/3 ? [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndInterp)].join('') :
			random < 2/3 ? TerminalTemplate.charsEndInterpStartDelim() :
			               TerminalTemplate.charsEndInterpStartInterp()
		)
	}
	private static charsEndInterpStartDelim(): string {
		const random: number = Math.random()
		return (
			random < 1/4 ? [`'`,   ...(Util.randomBool() ? [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndInterp)] : [''                                         ])] :
			random < 2/4 ? [`''`,  ...(Util.randomBool() ? [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndInterp)] : [''                                         ])] :
			random < 3/4 ? [`'{`,  ...(Util.randomBool() ? [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndInterp)] : [TerminalTemplate.charsEndInterpStartDelim()])] :
			               [`''{`, ...(Util.randomBool() ? [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndInterp)] : [TerminalTemplate.charsEndInterpStartDelim()])]
		).join('')
	}
	private static charsEndInterpStartInterp(): string {
		const random: number = Math.random()
		return (
			random < 1/3 ? [`{`,                                                 TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndInterp)                                                   ] :
			random < 2/3 ? [`{'`,  ...maybeA(() => Util.randomBool() ? [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndInterp)] : [TerminalTemplate.charsEndInterpStartInterp()])] :
			               [`{''`, ...maybeA(() => Util.randomBool() ? [TerminalTemplate.forbidden(), maybe(TerminalTemplate.charsEndInterp)] : [TerminalTemplate.charsEndInterpStartInterp()])]
		).join('')
	}
	random(start: string = TOKEN.TokenTemplate.DELIM, end: string = TOKEN.TokenTemplate.DELIM): string {
		return [start, maybe(end === TOKEN.TokenTemplate.DELIM ? TerminalTemplate.charsEndDelim : TerminalTemplate.charsEndInterp), end].join('')
	}
	match(candidate: Token, position: TemplatePosition = TemplatePosition.FULL): boolean {
		return candidate instanceof TOKEN.TokenTemplate && candidate.position === position
	}
}
