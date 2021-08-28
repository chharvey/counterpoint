import {
	Filebound,
	Token,
	Terminal,
} from '@chharvey/parser';
import {
	Util,
} from './package.js';
import {
	TemplatePosition,
	maybe,
	maybeA,
} from './utils.js';
import * as TOKEN from './token/index.js';
import {
	TerminalInteger,
} from './terminal/index.js';



export * from './terminal/index.js';



export class TerminalString extends Terminal {
	static readonly instance: TerminalString = new TerminalString()
	private static readonly escape_opts: readonly (() => string)[] = [
		(): string => Util.arrayRandom(TOKEN.TokenString.ESCAPES),
		(): string => `u{${ maybe(() => TerminalInteger.digitSequence(16n)) }}`,
		(): string => `\u000a`,
		(): string => Util.randomChar([TOKEN.TokenString.DELIM, TOKEN.TokenString.ESCAPER, ...'s t n r u \u000a'.split(' '), Filebound.EOT]),
	]
	private static maybeChars(): string {
		const random: number = Math.random()
		return maybe(() => (
			random < 1/3 ? [Util.randomChar([TOKEN.TokenString.DELIM, TOKEN.TokenString.ESCAPER, Filebound.EOT]),                                     TerminalString.maybeChars()]   :
			random < 2/3 ? [TOKEN.TokenString.ESCAPER,                                Util.arrayRandom(TerminalString.escape_opts)(),           TerminalString.maybeChars()]   :
			               [TOKEN.TokenString.ESCAPER, 'u', ...maybeA(() => [Util.randomChar([TOKEN.TokenString.DELIM, '{', Filebound.EOT]), TerminalString.maybeChars()])]
		).join(''))
	}
	random(): string {
		return [TOKEN.TokenString.DELIM, TerminalString.maybeChars(), TOKEN.TokenString.DELIM].join('')
	}
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenString
	}
}
abstract class TerminalTemplate extends Terminal {
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
export class TerminalTemplateFull extends TerminalTemplate {
	static readonly instance: TerminalTemplateFull = new TerminalTemplateFull()
	override random(): string {
		return super.random(TOKEN.TokenTemplate.DELIM, TOKEN.TokenTemplate.DELIM)
	}
	override match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.FULL)
	}
}
export class TerminalTemplateHead extends TerminalTemplate {
	static readonly instance: TerminalTemplateHead = new TerminalTemplateHead()
	override random(): string {
		return super.random(TOKEN.TokenTemplate.DELIM, TOKEN.TokenTemplate.DELIM_INTERP_START)
	}
	override match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.HEAD)
	}
}
export class TerminalTemplateMiddle extends TerminalTemplate {
	static readonly instance: TerminalTemplateMiddle = new TerminalTemplateMiddle()
	override random(): string {
		return super.random(TOKEN.TokenTemplate.DELIM_INTERP_END, TOKEN.TokenTemplate.DELIM_INTERP_START)
	}
	override match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.MIDDLE)
	}
}
export class TerminalTemplateTail extends TerminalTemplate {
	static readonly instance: TerminalTemplateTail = new TerminalTemplateTail()
	override random(): string {
		return super.random(TOKEN.TokenTemplate.DELIM_INTERP_END, TOKEN.TokenTemplate.DELIM)
	}
	override match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.TAIL)
	}
}
