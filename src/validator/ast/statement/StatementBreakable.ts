import {Statement} from './Statement.ts';



/**
 * A statement that is allowed to contain a `StatementBreak`.
 *
 * Known subclasses:
 * - StatementLoop
 * - StatementIteration
 */
export abstract class StatementBreakable extends Statement {
	#labelWhile?:    string;
	#labelDo?:       string;
	#labelEndwhile?: string;

	/** @final */
	public get labels(): {
		while:    string | undefined,
		do:       string | undefined,
		endwhile: string | undefined,
	} {
		return {
			while:    this.#labelWhile,
			do:       this.#labelDo,
			endwhile: this.#labelEndwhile,
		};
	}

	/** @final */
	protected set labelWhile(label: string) {
		this.#labelWhile = label;
	}

	/** @final */
	protected set labelDo(label: string) {
		this.#labelDo = label;
	}

	/** @final */
	protected set labelEndwhile(label: string) {
		this.#labelEndwhile = label;
	}
}
