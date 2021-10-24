import {
	Util,
	maybe,
	Token,
	TOKEN,
} from './package.js';
import {Terminal} from './Terminal.js';



export class TerminalIdentifier extends Terminal {
	static readonly instance: TerminalIdentifier = new TerminalIdentifier()
	private static charsBasic(start: boolean = false): string {
		let c: string;
		const pass: RegExp = start ? TOKEN.TokenIdentifierBasic.CHAR_START : TOKEN.TokenIdentifierBasic.CHAR_REST
		do {
			c = Util.randomChar()
		} while (!pass.test(c))
		return start ? c : [c, maybe(TerminalIdentifier.charsBasic)].join('')
	}
	private static charsUnicode(): string {
		return [maybe(TerminalIdentifier.charsUnicode), Util.randomChar(['`'])].join('')
	}
	random(): string {
		let returned: string;
		if (Util.randomBool()) {
			do {
				returned = [TerminalIdentifier.charsBasic(true), maybe(TerminalIdentifier.charsBasic)].join('')
			} while ((TOKEN.TokenKeyword.KEYWORDS as string[]).includes(returned))
		} else {
			returned = `\`${ maybe(TerminalIdentifier.charsUnicode) }\``
		}
		return returned
	}
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenIdentifier
	}
}
