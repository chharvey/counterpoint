import {
	Token,
	Terminal,
} from '@chharvey/parser';

import * as TOKEN from './Token.class'



export class TerminalIdentifier extends Terminal {
	static readonly instance: TerminalIdentifier = new TerminalIdentifier()
	random(): string { return 'Abc' }
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenIdentifier
	}
}



export class TerminalCharCode extends Terminal {
	static readonly instance: TerminalCharCode = new TerminalCharCode()
	random(): string { return '#x20' }
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenCharCode
	}
}



export class TerminalString extends Terminal {
	static readonly instance: TerminalString = new TerminalString()
	random(): string { return '"::="' }
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenString
	}
}



export class TerminalCharClass extends Terminal {
	static readonly instance: TerminalCharClass = new TerminalCharClass()
	random(): string { return '[A-Z]' }
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenCharClass
	}
}
