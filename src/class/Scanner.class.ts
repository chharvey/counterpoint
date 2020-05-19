import Char, {
	SOT,
	EOT,
} from './Char.class'



/**
 * A Scanner object reads through the source text and returns one character at a time.
 * @see http://parsingintro.sourceforge.net/#contents_item_4.2
 */
export default class Scanner {
	/** The entire source text of the program. */
	readonly source_text: string;
	/**
	 * Construct a new Scanner object.
	 * @param source - the source text
	 */
	constructor(source: string) {
		this.source_text = `${ SOT }\n${ source.replace(/\r\n|\r/g, '\n') }\n${ EOT }`
	}

	/**
	 * Return the next character in source text.
	 * @returns the next character in source text
	 */
	* generate(): IterableIterator<Char> {
		for (let source_index: number = 0; source_index < this.source_text.length; source_index++) {
			yield new Char(this, source_index)
		}
	}
}
