import {
	NonemptyArray,
	Util,
	Filebound,
	maybe,
	choose,
	Token,
	TOKEN,
	Terminal,
} from './package.js';
import {TerminalInteger} from './TerminalInteger.js';



export class TerminalString extends Terminal {
	static readonly instance: TerminalString = new TerminalString()
	private static readonly escape_opts: Readonly<NonemptyArray<() => string>> = [
		(): string => Util.arrayRandom(TOKEN.TokenString.ESCAPES),
		(): string => `u{${ maybe(() => TerminalInteger.digitSequence(16n)) }}`,
		(): string => `\u000a`,
		(): string => Util.randomChar([TOKEN.TokenString.DELIM, TOKEN.TokenString.ESCAPER, ...'s t n r u \u000a'.split(' '), Filebound.EOT]),
	]
	private static maybeChars(): string {
		return maybe(() => choose(
			() => [Util.randomChar([TOKEN.TokenString.DELIM, TOKEN.TokenString.ESCAPER, Filebound.EOT]),                        TerminalString.maybeChars()           ].join(''),
			() => [TOKEN.TokenString.ESCAPER, Util.arrayRandom(TerminalString.escape_opts)(),                                   TerminalString.maybeChars()           ].join(''),
			() => [TOKEN.TokenString.ESCAPER, 'u', maybe(() => [Util.randomChar([TOKEN.TokenString.DELIM, '{', Filebound.EOT]), TerminalString.maybeChars()].join(''))].join(''),
		));
	}
	random(): string {
		return [TOKEN.TokenString.DELIM, TerminalString.maybeChars(), TOKEN.TokenString.DELIM].join('')
	}
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenString
	}
}
