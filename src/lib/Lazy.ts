import type {NonemptyArray} from './utils-public.ts';



type Unwound<T> = T extends Lazy<infer U> ? Unwound<U> : T;



/**
 * A deferred evaluation.
 * May or may not contain a value. Once evaluated, the value stays there.
 * @typeparam T the type of value to be evaluated
 */
export class Lazy<T> {
	/**
	 * Convenience method for constructing a new Lazy object with an already-evaluated value.
	 * @typeparam S the type parameter of the new Lazy
	 * @param value the evaluated value
	 * @return      an already-evald Lazy with a value of `value`
	 */
	public static of<S>(value: S): Lazy<S> {
		const returned = new Lazy<S>(() => value);
		returned.force();
		return returned;
	}

	/**
	 * Returns a Lazy that, when forced, will eval all given Lazys and resolve to an array of their values.
	 * Returns an array of all Lazys’ filled values.
	 * If any Lazy is unevald, this method returns an unevald Lazy.
	 * @typeparam S the type parameter of the Lazy items in `items`
	 * @param items the array of Lazy objects to eval
	 * @return      a Lazy evaluating to an array of items’ values
	 */
	public static whenAll<S>(items: readonly Lazy<S>[]): Lazy<S[]> {
		return new Lazy<S[]>(() => items.map((item) => item.force()));
	}

	/**
	 * Returns a Lazy that, when forced, will resolve to the first (leftmost) already-evald Lazy’s value,
	 * or, if there are none, will eval the first (index 0) Lazy and resolve to its value.
	 * @typeparam S the type parameter of the Lazy items in `items`
	 * @param items the array of Lazy objects to eval
	 * @return      a Lazy evaluating to any value of an item in the an array
	 */
	public static whenAny<S>(items: NonemptyArray<Lazy<S>>): Lazy<S> {
		return new Lazy<S>(() => {
			for (const item of items) {
				if (item.#evald) {
					return item.#value!;
				}
			}
			return items[0].force();
		});
	}


	/** Does this Lazy hold a value? */
	#evald = false;

	/** The value held by this Lazy. */
	#value?: T;

	/** Stores the expression to evaluate. */
	readonly #thunk: () => T;

	/**
	 * Construct a new Lazy object.
	 * @example
	 * new Lazy.<number | Error>(() => {
	 * 	let outcome: number | Error = some_condition
	 * 		? 42
	 * 		: new Error("oops— rejected.");
	 * 	return outcome;
	 * });
	 * @param thunk the deferred expression to evaluate to a value contained in this Lazy
	 */
	public constructor(thunk: () => T) {
		this.#thunk = thunk.bind(null);
	}

	/** Does this Lazy contain a value? */
	public get isEvald(): boolean {
		return this.#evald;
	}

	/**
	 * Force this Lazy to evaluate, then return the value.
	 * @return the value held in this Lazy
	 */
	public force(): T {
		if (!this.#evald) {
			[this.#evald, this.#value] = [true, this.#thunk.call(null)];
		}
		return this.#value!;
	}

	/**
	 * Recursively flattens nested Lazys into one non-Lazy value.
	 * Useful when this Lazy has another Lazy as its value.
	 * @return a Lazy containing the first non-Lazy value
	 */
	public flatten(): Lazy<Unwound<T>> {
		return this.#evald
			? (this.#value instanceof Lazy ? this.#value.flatten() : this) as Lazy<Unwound<T>>
			: this.map<Unwound<T>>((value) => (value instanceof Lazy ? value.flatten().force() : value) as Unwound<T>);
	}

	/**
	 * Return a new Lazy that will hold the result of the given callback function.
	 * If this Lazy is already filled, the returned Lazy will already be filled.
	 * Else, the returned Lazy will get filled synchronously once this Lazy is filled.
	 * @typeparam U    the return type of `callback`
	 * @param callback a function to determine the new Lazy’s value
	 * @return         a new Lazy holding the result of `callback`
	 */
	public map<U = T>(callback: (value: T) => U): Lazy<U> {
		if (this.#evald) {
			const value: U = callback.call(null, this.#value!);
			return new Lazy<U>(() => value);
		}
		return new Lazy<U>(() => callback.call(null, this.force()));
	}

	/**
	 * Return the result of the given callback function.
	 * Similar to {@link Lazy#map}, but the callback function is expected to return a Lazy type.
	 * If this Lazy is filled, this method will return the exact result (by identity, `===`) of the callback function.
	 * Else, this method will return an empty Lazy, which will be filled once this Lazy is filled.
	 * In that case the value of the returned Lazy will be the value of the callback’s returned Lazy (or its future value).
	 * @typeparam U    the type parameter of Lazy returned by `callback`
	 * @param callback a function to determine the new Lazy
	 * @return         the result of `callback`
	 */
	public flatMap<U = T>(callback: (value: T) => Lazy<U>): Lazy<U> {
		return this.#evald
			? callback.call(null, this.#value!)
			: this.map<U>((value) => callback.call(null, value).force());
	}
}
