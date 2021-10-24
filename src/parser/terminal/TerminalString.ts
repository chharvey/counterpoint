import type {
	Token,
} from '@chharvey/parser';
import {
	Util,
	Filebound,
	maybe,
	maybeA,
	TOKEN,
} from './package.js';
import {Terminal} from './Terminal.js';
import {TerminalInteger} from './TerminalInteger.js';



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
