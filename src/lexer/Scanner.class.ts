import SolidConfig, {CONFIG_DEFAULT} from '../SolidConfig'
import Lexer from './Lexer.class'
import Char from './Char.class'
import {
	Filebound,
} from './Token.class'



/**
 * A Scanner object reads through the source text and returns one character at a time.
 * @see http://parsingintro.sourceforge.net/#contents_item_4.2
 */
abstract class Scanner {
	/** The entire source text of the program. */
	readonly source_text: string

	/**
	 * Construct a new Scanner object.
	 * @param source - the source text
	 */
	constructor (
		source: string,
	) {
		this.source_text = `${ Filebound.SOT }\n${ source.replace(/\r\n|\r/g, '\n') }\n${ Filebound.EOT }`
	}

	/**
	 * Return the next character in source text.
	 * @returns the next character in source text
	 */
	abstract generate(): Generator<Char>;
}



export default class ScannerSolid extends Scanner {
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

	* generate(): Generator<Char> {
		for (let source_index: number = 0; source_index < this.source_text.length; source_index++) {
			yield new Char(this, source_index)
		}
	}

	/**
	 * Construct a new Lexer object from this Scanner.
	 * @return a new Lexer with this Scanner as its argument
	 */
	get lexer(): Lexer {
		return new Lexer(this.generate(), this.config)
	}
}
