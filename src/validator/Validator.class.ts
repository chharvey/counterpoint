import type SolidConfig from '../SolidConfig'
import type {
	ParseNodeGoal,
} from '../parser/'
import {Builder} from '../builder/'
import type {
	SemanticNodeGoal,
} from './SemanticNode.class'



/**
 * The Validator is responsible for semantically analyzing, type-checking, and validating source code.
 */
export default class Valdator {
	/**
	 * Construct a new Validator object.
	 * @param parsegoal - A syntactic goal produced by a parser.
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		private readonly parsegoal: ParseNodeGoal,
		private readonly config: SolidConfig,
	) {
	}

	/**
	 * Type-check the entire source.
	 * Assert that there are no type errors, and then return a semantic goal symbol.
	 * @return the decorated goal parse node
	 */
	validate(): SemanticNodeGoal {
		const semantic_goal: SemanticNodeGoal = this.parsegoal.decorate(this)
		semantic_goal.typeCheck(this.config.compilerOptions) // assert does not throw
		return semantic_goal
	}

	/**
	 * Construct a new Builder object from this Validator.
	 * @return a new Builder with this Validator as its argument
	 */
	get builder(): Builder {
		return new Builder(this.validate(), this.config)
	}
}
