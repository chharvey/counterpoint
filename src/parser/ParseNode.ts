import * as xjs from 'extrajs';
import type {Serializable} from './package.js';
import {
	EBNFObject,
	stringifyAttributes,
} from './utils-public.js';
import type {Token} from './Token.js';



/**
 * A ParseNode is a node in a parse tree for a given input stream.
 * It holds:
 * - the group of child inputs ({@link Token}s and/or other ParseNodes)
 * - the line number and column index where the text code of the node starts
 *
 * A ParseNode is an arrangement of Tokens in a tree structure.
 * For example, parsing the expression `5 + 2 * 3` might yield the following tree:
 * ```xml
 * <ParseNodeAdd>
 * 	<ParseNodeAdd>
 * 		<ParseNodeMult>
 * 			<NUMBER>5</NUMBER>
 * 		</ParseNodeMult>
 * 	</ParseNodeAdd>
 * 	<PUNCTUATOR>+</PUNCTUATOR>
 * 	<ParseNodeMult>
 * 		<ParseNodeMult>
 * 			<NUMBER>2</NUMBER>
 * 		</ParseNodeMult>
 * 		<PUNCTUATOR>*</PUNCTUATOR>
 * 		<NUMBER>3</NUMBER>
 * 	</ParseNodeMult>
 * </ParseNodeAdd>
 * ```
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_8.2
 */
export class ParseNode implements Serializable {
	/**
	 * Make a classname for a ParseNode.
	 * @param   json a JSON object representing a production
	 * @returns      the classname
	 */
	static classnameOf(json: EBNFObject | {readonly prod: string}): string {
		return `ParseNode${ ('prod' in json) ? json.prod : json.name }`;
	}

	/**
	 * Takes a JSON object representing a syntactic production
	 * and returns a string in TypeScript language representing subclasses of {@link ParseNode}.
	 * @param   json a JSON object representing a production
	 * @returns      a string to print to a TypeScript file
	 */
	static fromJSON(json: EBNFObject): string {
		return xjs.String.dedent`
			export ${ (json.family === true) ? 'abstract ' : '' }class ${ this.classnameOf(json) } extends ${ (typeof json.family === 'string')
				? this.classnameOf({prod: json.family})
				: 'ParseNode'
			} {
				declare readonly children:
					| ${ json.defn.map((seq) => `readonly [${ seq.map((it) =>
						(typeof it === 'string' || 'term' in it)
							? `Token`
							: this.classnameOf(it)
					).join(', ') }]`).join('\n\t\t| ') }
				;
			}
		`;
	}


	/** @implements Serializable */
	readonly tagname: string = this.constructor.name.slice('ParseNode'.length);
	/** @implements Serializable */
	readonly source: string = this.children.map((child) => child.source).join(' ');
	/** @implements Serializable */
	readonly source_index: number = this.children[0].source_index;
	/** @implements Serializable */
	readonly line_index: number = this.children[0].line_index;
	/** @implements Serializable */
	readonly col_index: number = this.children[0].col_index;

	/**
	 * Construct a new ParseNode object.
	 * @param children The set of child inputs that creates this ParseNode.
	 */
	constructor (
		readonly children: readonly (Token | ParseNode)[],
	) {
	}

	/** @implements Serializable */
	serialize(): string {
		return `<${ this.tagname } ${ stringifyAttributes(new Map<string, string>([
			['line',   (this.line_index + 1).toString()],
			['col',    (this.col_index  + 1).toString()],
			['source', this.source],
		])) }>${ this.children.map((child) => child.serialize()).join('') }</${ this.tagname }>`;
	}
}
