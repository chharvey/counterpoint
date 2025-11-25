/**
 * A slot to hold a value.
 * May or may not contain a value. Once filled, the value stays there.
 * @typeparam T the type of value to be held
 */
export class Slot<T> {
	/**
	 * Returns an array of all Slots’ filled values.
	 * If any Slot is empty, this method returns an empty Slot.
	 * @typeparam S the type parameter of the Slot items in `items`
	 * @param items the array of Slot objects to unwrap
	 */
	public static unwrapAll<S>(items: Array<Slot<S>>): Slot<S[]> {
		const returned = new Slot<S[]>();
		const values: S[] = [];
		if (!items.length) {
			return returned.fill(values);
		}
		items.forEach((item, i) => {
			item.map((value) => {
				values[i] = value; // not using `.push()` because we want to preserve order
				if (values.length === items.length) {
					returned.fill(values);
				}
			});
		});
		return returned;
	}

	/**
	 * Returns the filled value of the first Slot to fill.
	 * @typeparam S the type parameter of the Slot items in `items`
	 * @param items the array of Slot objects to unwrap
	 * @throws      if an empty array is given
	 */
	public static unwrapAny<S>(items: Array<Slot<S>>): Slot<S> {
		const returned = new Slot<S>();
		for (const item of items) {
			if (returned.isFilled) {
				break;
			}
			item.map((value) => {
				returned.fill(value);
			});
		}
		return returned;
	}


	/** Does this Slot hold a value? */
	#filled = false;

	/** The value held by this Slot. */
	#value?: T;

	/** A storage of ‘onFill’ handlers. */
	readonly #handlers: Array<(value: T) => void> = [];

	/**
	 * Construct a new Slot object.
	 * @param value if present, the value contained by this Slot
	 */
	public constructor(value?: T) {
		if (arguments.length) {
			this.fill(value!);
		}
	}

	/** Does this Slot contain a value? */
	public get isFilled(): boolean {
		return this.#filled;
	}

	/**
	 * Fill this Slot with a value.
	 * If this Slot already has a value, do nothing.
	 * @param value the value to fill
	 */
	public fill(value: T): this {
		if (!this.#filled) {
			if (value === this as unknown) {
				throw new Error('Cannot use self as value!');
			}
			[this.#filled, this.#value] = [true, value];
			while (this.#handlers.length) {
				this.#handlers.shift()!(value);
			}
		}
		return this;
	}

	/**
	 * Get the value held in this Slot, or throw if there is none.
	 * @return the value held in this Slot
	 * @throws if this Slot is not filled
	 */
	public unwrap(): T {
		if (!this.#filled) {
			throw new Error('Slot is empty.');
		}
		return this.#value!;
	}

	/**
	 * Recursively flattens nested Slots into one Slot containing a non-Slot value.
	 * Useful when this Slot has another Slot as its value.
	 * @return a new Slot containing the first non-Slot value
	 */
	public flatten(): Slot<Unwound<T>> {
		return (this.#value instanceof Slot ? this.#value.flatten() : this.map((v) => v)) as Slot<Unwound<T>>;
	}

	/**
	 * Return a new Slot that will hold the result of the given callback function.
	 * If this Slot is already filled, the returned Slot will already be filled.
	 * Else, the returned Slot will get filled synchronously once this Slot is filled.
	 * @typeparam U    the return type of `callback`
	 * @param callback a function to determine the new Slot’s value
	 * @return         a new Slot holding the result of `callback`
	 */
	public map<U = T>(callback: (value: T) => U): Slot<U> {
		const next = new Slot<U>();
		if (this.#filled) {
			return next.fill(callback.call(null, this.#value!));
		}
		this.#handlers.push((value) => {
			next.fill(callback.call(null, value));
		});
		return next;
	}

	/**
	 * Return the result of the given callback function.
	 * Similar to {@link Slot.map}, but the callback function is expected to return a Slot type.
	 * If this Slot is filled, this method will return the exact result (by identity, `===`) of the callback function.
	 * Else, this method will return an empty Slot, which will be filled once this Slot is filled.
	 * In that case the value of the returned Slot will be the value of the callback’s returned Slot (or its future value).
	 * @typeparam U    the type parameter of Slot returned by `callback`
	 * @param callback a function to determine the new Slot
	 * @return         the result of `callback`
	 */
	public flatMap<U = T>(callback: (value: T) => Slot<U>): Slot<U> {
		if (this.#filled) {
			return callback.call(null, this.#value!);
		}
		const next = new Slot<U>();
		this.map((value) => callback.call(null, value).map((v) => next.fill(v)));
		return next;
	}
}



type Unwound<T> = T extends Slot<infer U> ? Unwound<U> : T;
