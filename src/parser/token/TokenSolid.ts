import {Token} from '@chharvey/parser';
import type {CodeUnit} from '../../types.js';



export abstract class TokenSolid extends Token {
	/**
	 * Return this Token’s cooked value.
	 * The cooked value is the computed or evaluated contents of this Token,
	 * to be sent to the parser and compiler.
	 * If this Token is not to be sent to the parser, then return `null`.
	 * @returns              the computed value of this token, or `null`
	 */
	abstract cook():
		| null       // TokenIdentifier
		| bigint     // TokenPuncuator | TokenKeyword | TokenIdentifier
		| number     // TokenNumber
		| CodeUnit[] // TokenString | TokenTemplate
	;
}
