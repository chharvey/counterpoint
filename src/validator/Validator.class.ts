import type SolidConfig from '../SolidConfig'
import {Parser} from '../parser/'
import type {
	SemanticNodeGoal,
} from './SemanticNode.class'



/**
 * The Validator is responsible for semantically analyzing, type-checking, and validating source code.
 */
export default class Valdator {
	/** The parser. */
	private readonly parser: Parser;
	/** The semantic goal symbol of the program. */

	/**
	 * Construct a new Validator object.
	 * @param source - the entire source text
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		source: string,
		private readonly config: SolidConfig,
	) {
		this.parser = new Parser(source, this.config)
	}

	/**
	 * Type-check the entire source.
	 * Assert that there are no type errors, and then return a semantic goal symbol.
	 * @return the decorated goal parse node
	 */
	validate(): SemanticNodeGoal {
		const semantic_goal: SemanticNodeGoal = this.parser.parse().decorate()
		semantic_goal.typeCheck(this.config.compilerOptions) // assert does not throw
		return semantic_goal
	}
}
