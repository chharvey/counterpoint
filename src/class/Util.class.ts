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
	 * Select a random element from the provided array.
	 * @param   array - the array to select from
	 * @returns         a uniformly-distributed random element from the array
	 */
	static arrayRandom<T>(array: readonly T[]): T {
		return array[Math.floor(Math.random() * array.length)]
	}
}
