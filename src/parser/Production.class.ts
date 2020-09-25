import Util from '../class/Util.class'
import type ParseNode from './ParseNode.class'
import type {GrammarSymbol} from './Grammar.class'
import Rule from './Rule.class'



export type KleenePlus<T> = readonly [T, ...readonly T[]]
type JSONSequence = KleenePlus<JSONItem>
type JSONItem =
	| string
	| { term: string }
	| { prod: string }

/**
 * A Production is an item in a formal context-free grammar.
 * It consists of a nonterminal on the left-hand side, which serves as the identifier of the production,
 * and on the right-hand side one ore more choices, or sequences of terminals and/or nonterminals,
 * which can be reduced to the left-hand side nonterminal in a parsing action.
 */
export default abstract class Production {
	/**
	 * Takes a list of JSON objects representing syntactic productions
	 * and returns a string in TypeScript language representing subclasses of {@link Production}.
	 * @param json JSON objects representing a production
	 * @returns a string to print to a TypeScript file
	 */
	static fromJSON(jsons: {
		name: string,
		defn: KleenePlus<JSONSequence>,
	}[]): string {
		function randomCallback(it: JSONItem) {
			return (
				(typeof it === 'string') ? it :
				('term' in it) ? `Terminal.Terminal${ Util.screamingToPascal(it.term) }.instance.random()` :
				`...Production${ it.prod }.instance.random()`
			)
		}
		return `
			import type {GrammarSymbol}     from './Grammar.class';
			import * as Terminal            from './Terminal.class';
			import Production, {KleenePlus} from './Production.class';
			${ jsons.map((json) => `
				export class Production${ json.name } extends Production {
					static readonly instance: Production${ json.name } = new Production${ json.name }();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							${ json.defn.map((seq) => `[${ seq.map((it) =>
								(typeof it === 'string') ? it :
								('term' in it) ? `Terminal.Terminal${ Util.screamingToPascal(it.term) }.instance` :
								`Production${ it.prod }.instance`
							) }]`) },
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							${ json.defn.slice(0, -1).map((seq, i) =>
								`random < ${ i + 1 }/${ json.defn.length } ? [${ seq.map(randomCallback) }] :`
							).join(' ') }
							[${ json.defn[json.defn.length - 1].map(randomCallback) }]
						);
					}
				}
			`).join('') }
		`
	}


	protected constructor() {}

	/** @final */ get displayName(): string {
		return this.constructor.name.slice('Production'.length)
	}

	/**
	 * A set of sequences of parse symbols (terminals and/or nonterminals) in this production.
	 */
	abstract get sequences(): KleenePlus<KleenePlus<GrammarSymbol>>;

	/**
	 * Generate a random instance of this Production.
	 * @returns a well-formed sequence of strings satisfying this Production
	 */
	abstract random(): string[];

	/**
	 * Does the given ParseNode satisfy a Rule in this Production?
	 * @param   candidate - a ParseNode to test
	 * @returns             Does the given ParseNode satisfy a Rule in this Production?
	 * @final
	 */
	match(candidate: ParseNode): boolean {
		return candidate.rule.production.equals(this)
	}

	/**
	 * Is this production “equal to” the argument?
	 *
	 * Two productions are “equal” if they are the same object, or all of the following are true:
	 * - The corresponding rules of both productions are “equal” (by {@link Rule#equals}).
	 *
	 * @param   prod - the production to compare
	 * @returns        is this production “equal to” the argument?
	 * @final
	 */
	equals(prod: Production) {
		return this === prod ||
			Util.equalArrays<Rule>(this.toRules(), prod.toRules(), (r1, r2) => r1.equals(r2))
	}

	/**
	 * Generate grammar rules from this Production.
	 * @returns this Production split into several rules
	 * @final
	 */
	toRules(): Rule[] {
		return this.sequences.map((_, i) => new Rule(this, i))
	}
}
