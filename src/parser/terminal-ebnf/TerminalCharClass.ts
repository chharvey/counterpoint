import {
	Token,
	TOKEN,
	Terminal,
} from './package.js';



export class TerminalCharClass extends Terminal {
	static readonly instance: TerminalCharClass = new TerminalCharClass();
	override match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenCharClass;
	}
}
