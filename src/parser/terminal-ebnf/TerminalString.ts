import {
	Token,
	TOKEN,
	Terminal,
} from './package.js';



export class TerminalString extends Terminal {
	static readonly instance: TerminalString = new TerminalString();
	override match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenString;
	}
}
