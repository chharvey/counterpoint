import {
	Scanner,
} from '@chharvey/parser';

import SolidConfig, {CONFIG_DEFAULT} from '../SolidConfig'
import {LexerSolid as Lexer} from './Lexer.class'



export class ScannerSolid extends Scanner {
	/**
	 * Construct a new ScannerSolid object.
	 * @param source - the source text
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		source: string,
		private readonly config: SolidConfig = CONFIG_DEFAULT,
	) {
		super(source)
	}

	/**
	 * Construct a new Lexer object from this Scanner.
	 * @return a new Lexer with this Scanner as its argument
	 */
	get lexer(): Lexer {
		return new Lexer(this.generate(), this.config)
	}
}
