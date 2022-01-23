import {
	NonemptyArray,
	Util,
	Keyword,
	Token,
	TOKEN,
	Terminal,
} from './package.js';



const KEYWORD_TYPE: NonemptyArray<Keyword> = [
	Keyword.VOID,
	Keyword.BOOL,
	Keyword.INT,
	Keyword.FLOAT,
	Keyword.STR,
	Keyword.OBJ,
];



export class TerminalKeywordType extends Terminal {
	static readonly instance: TerminalKeywordType = new TerminalKeywordType();
	random(): Keyword {
		return Util.arrayRandom(KEYWORD_TYPE);
	}
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenKeyword && (KEYWORD_TYPE as string[]).includes(candidate.source);
	}
}
