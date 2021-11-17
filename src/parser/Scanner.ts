import {Filebound} from './utils-public.js';
import {Char} from './Char.js';



/**
 * A Scanner object reads through the source text and returns one character at a time.
 * @see http://parsingintro.sourceforge.net/#contents_item_4.2
 * @final
 */
export class Scanner {
	/**
	 * Normalize line endings.
	 * 1. Prepend the file with a **U+0002 START OF TEXT** (“SOT”) character followed by a **U+000A LINE FEED (LF)** character.
	 * 2. Replace any two-character sequence CR–LF and any single CR (**U+000D CARRIAGE RETURN (CR)**) not followed by an LF
	 * 	with a single LF character.
	 * 3. Append the file with a **U+000A LINE FEED (LF)** character followed by a **U+0003 END OF TEXT** (“EOT”) character.
	 * @param source the text to normalize
	 * @returns      the normalized text
	 */
	static normalize(source: string): string {
		return [Filebound.SOT, '\n', source.replace(/\r\n|\r/g, '\n'), '\n', Filebound.EOT].join('');
	}

	/**
	 * Return the next character in source text.
	 * @param source the source text
	 * @returns the next character in source text
	 */
	static * generate(source: string): Generator<Char> {
		const source_text: string = Scanner.normalize(source);
		for (let source_index: number = 0; source_index < source_text.length; source_index++) {
			yield new Char(source_text, source_index);
		}
	}
}
