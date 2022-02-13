import * as xjs from 'extrajs';
import type {NonemptyArray} from './package.js';
import type {EBNFObject} from './utils-public.js';
import {
	GrammarSymbol,
	macroToTitle,
} from './utils-private.js';



/**
 * A Production is an item in a formal context-free grammar.
 * It consists of a nonterminal on the left-hand side, which serves as the identifier of the production,
 * and on the right-hand side one ore more choices, or sequences of terminals and/or nonterminals,
 * which can be reduced to the left-hand side nonterminal in a parsing action.
 */
export abstract class Production {
	/**
	 * Make a classname for a Production.
	 * @param   json a JSON object representing a production
	 * @returns      the classname
	 */
	static classnameOf(json: EBNFObject | {readonly prod: string}): string {
		return `Production${ ('prod' in json) ? json.prod : json.name }`;
	}

	/**
	 * Takes a JSON object representing a syntactic production
	 * and returns a string in TypeScript language representing subclasses of {@link Production}.
	 * @param   json a JSON object representing a production
	 * @returns      a string to print to a TypeScript file
	 */
	static fromJSON(json: EBNFObject): string {
		return (json.family === true) ? '' : xjs.String.dedent`
			class ${ this.classnameOf(json) } extends Production {
				static readonly instance: ${ this.classnameOf(json) } = new ${ this.classnameOf(json) }();
				override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						${ json.defn.map((seq) => `[${ seq.map((it) =>
							(typeof it === 'string') ? `'${ it }'` :
							('term' in it) ? `TERMINAL.Terminal${ macroToTitle(it.term) }.instance` :
							`${ this.classnameOf(it) }.instance`
						).join(', ') }],`).join('\n\t\t\t') }
					];
				}
			}
		`;
	}


	protected constructor () {
	}

	/** @final */ get displayName(): string {
		return this.constructor.name.slice('Production'.length);
	}

	/**
	 * A set of sequences of parse symbols (terminals and/or nonterminals) in this production.
	 */
	abstract get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>>;
}
