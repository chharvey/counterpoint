/**
 * Utility fields and methods.
 */
export default class Util {
	/**
	 * Return a random boolean value.
	 * @returns a random boolean value
	 */
	static randomBool(): boolean {
		return Math.random() < 0.5
	}

	/**
	 * Remove indentation from string templates, and appends a line feed.
	 * @param   s the string to remove indentation from each line
	 * @returns   the string with indentation removed and a line feed appended
	 */
	static dedent(s: string): string {
		s = `${s.trimEnd()}\n`
		const indents: RegExpMatchArray|null = s.match(/\n\t*/)
		return (indents) ? s.replace(new RegExp(`\\n\\t{${indents[0].length - 1}}`, 'g'), '\n') : s
	}

	/**
	 * Select a random element from the provided array.
	 * @param   array - the array to select from
	 * @returns         a uniformly-distributed random element from the array
	 */
	static arrayRandom<T>(array: readonly T[]): T {
		return array[Math.floor(Math.random() * array.length)]
	}

	/**
	 * Are the two arrays “equal”?
	 *
	 * Two arrays are “equal” if they are the same object,
	 * or if index by index, their elements are either strictly equal (`===`),
	 * or “equal” by some other predicate.
	 *
	 * @param   <T> the types of the arrays
	 * @param   a1 - the first array
	 * @param   a2 - the second array
	 * @param   predicate - the comparison function to determine equality
	 * @returns      do the two arrays have the exact same elements at the same indices?
	 */
	static equalArrays<T>(a1: readonly T[], a2: readonly T[], predicate: (t1: T, t2: T) => boolean = (t1: T, t2: T) => t1 === t2): boolean {
		return a1 === a2 || a1.length === a2.length && a1.every((e1, i) => e1 === a2[i] || predicate(e1, a2[i]))
	}

	/**
	 * Are the two sets “equal”?
	 *
	 * Two sets are “equal” if they are the same object,
	 * or if they are subsets of each other (that is, if each set has the same elements as the other).
	 *
	 * @param   <T> the types of the sets
	 * @param   s1 - the first set
	 * @param   s2 - the second set
	 * @returns      do the two set have the exact same elements?
	 */
	static equalSets<T>(s1: ReadonlySet<T>, s2: ReadonlySet<T>): boolean {
		return s1 === s2 || s1.size === s2.size && [...s1].every((e1) => s2.has(e1))
	}
}
