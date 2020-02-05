import Char, {STX, ETX} from './Char.class'



/**
 * A Scanner object reads through the source text and returns one character at a time.
 * @see http://parsingintro.sourceforge.net/#contents_item_4.2
 */
export default class Scanner {
	/**
	 * Construct a new Scanner object.
	 * @param   source_text - the entire source text
	 */
	constructor(
		readonly source_text: string,
	) {
		this.source_text = `${STX}\n${this.source_text.replace(/\r\n|\r/g, '\n')}${ETX}`
	}

	/**
	 * Return the next character in source text.
	 * @returns the next character in source text
	 */
	* generate(): Iterator<Char, void> {
		for (let source_index: number = 0; source_index < this.source_text.length; source_index++) {
			yield new Char(this, source_index)
		}
	}
}
