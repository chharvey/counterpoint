import {
	Token,
	TOKEN,
	Terminal,
} from './package.js';



export class TerminalIdentifier extends Terminal {
	static readonly instance: TerminalIdentifier = new TerminalIdentifier();
	override match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenIdentifier;
	}
}
