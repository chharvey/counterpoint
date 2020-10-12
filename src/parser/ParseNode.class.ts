import type {
	Serializable,
	Token,
} from '@chharvey/parser';

import type {
	EBNFObject,
} from '../types.d'
import Util from '../class/Util.class'
import type Rule from './Rule.class'



/**
 * A ParseNode is a node in a parse tree for a given input stream.
 * It holds:
 * - the group of child inputs ({@link Token}s and/or other ParseNodes)
 * - the line number and column index where the text code of the node starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_8.2
 */
export class ParseNode implements Serializable {
	/**
	 * Takes a list of JSON objects representing syntactic productions
	 * and returns a string in TypeScript language representing subclasses of {@link ParseNode}.
	 * @param json JSON objects representing a production
	 * @returns a string to print to a TypeScript file
	 */
	static fromJSON(jsons: EBNFObject[]): string {
		return `
			import type {Token} from '@chharvey/parser';
			import {ParseNode} from '../parser/ParseNode.class';
			${ jsons.map((json) => `
				export class ParseNode${ json.name } extends ParseNode {
					declare children:
						${ json.defn.map((seq) => `readonly [${seq.map((it) =>
							(typeof it === 'string' || 'term' in it)
								? `Token`
								: `ParseNode${ it.prod }`
						) }]`).join(' | ') }
					;
				}
			`).join('') }
		`
	}


	/** @implements Serializable */
	readonly tagname: string = this.rule.production.displayName
	/** @implements Serializable */
	readonly source: string = this.children.map((child) => child.source).join(' ')
	/** @implements Serializable */
	readonly source_index: number = this.children[0].source_index
	/** @implements Serializable */
	readonly line_index: number = this.children[0].line_index
	/** @implements Serializable */
	readonly col_index: number = this.children[0].col_index

	/**
	 * Construct a new ParseNode object.
	 *
	 * @param rule     - The Rule used to create this ParseNode.
	 * @param children - The set of child inputs that creates this ParseNode.
	 */
	constructor(
		readonly rule: Rule,
		readonly children: readonly (Token|ParseNode)[],
	) {
	}

	/**
	 * @implements Serializable
	 */
	serialize(): string {
		const attributes: Map<string, string> = new Map<string, string>()
		attributes.set('line', `${ this.line_index + 1 }`)
		attributes.set('col',  `${ this.col_index  + 1 }`)
		attributes.set('source', this.source)
		const contents: string = this.children.map((child) => child.serialize()).join('')
		return `<${this.tagname} ${Util.stringifyAttributes(attributes)}>${contents}</${this.tagname}>`
	}
}
