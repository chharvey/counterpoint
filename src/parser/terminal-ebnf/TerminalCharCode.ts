import {
	Token,
	TOKEN,
	Terminal,
} from './package.js';



export class TerminalCharCode extends Terminal {
	static readonly instance: TerminalCharCode = new TerminalCharCode();
	override match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenCharCode;
	}
}
