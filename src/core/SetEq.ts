/**
 * A Set that compares elements via the provided comparator function.
 * Elements that are “equal” (as defined by the comparator) are considered the same element.
 * @example
 * const my_set: SetEq<{id: number}> = new SetEq((a, b) => a.id === b.id);
 * const el: {id: number} = {id: 42};
 * my_set.add(el);
 * assert.ok(my_set.has({id: 42}));
 * my_set.add({id: 42});
 * assert.strictEqual(my_set.size, 1);
 * @typeParam T the type of the elements in this Set
 */
export class SetEq<T> extends Set<T> {
	/**
	 * Construct a new SetEq object given a comparator.
	 * The comparator function compares elements in this SetEq.
	 * Elements for which the function returns `true` are considered ”equal” and unique.
	 * If no comparator function is provided, the `SameValueZero` algorithm is used.
	 * @param comparator a function comparing elements in this set
	 * @param items      the items to add to this set
	 */
	constructor (
		private readonly comparator: (a: T, b: T) => boolean = (a, b) => a === b || Object.is(a, b),
		items: Iterable<T> = [],
	) {
		super(); // cannot call `super(items)` because it internally calls `this.has`
		[...items].forEach((el) => {
			this.add(el);
		});
	}

	/**
	 * @inheritdoc
	 */
	override has(el: T): boolean {
		return super.has(el) || [...this].some((e) => this.comparator.call(null, e, el));
	}

	/**
	 * @inheritdoc
	 */
	override add(el: T): this {
		const foundel: boolean = [...this].some((e) => this.comparator.call(null, e, el));
		return (!foundel) ? super.add(el): this;
	}

	/**
	 * @inheritdoc
	 */
	override delete(el: T): boolean {
		const foundel: T | undefined = [...this].find((e) => this.comparator.call(null, e, el));
		return super.delete((foundel === void 0) ? el : foundel);
	}

	/**
	 * Return the intersection (conjunction) of this set with the argument.
	 * @see xjs.Set.intersection
	 * @param   that the other set
	 * @returns a new SetEq containing the elements present only in both `a` and `b`
	 */
	intersection(that: ReadonlySet<T>): SetEq<T> {
		const returned: SetEq<T> = new SetEq<T>(this.comparator);
		that.forEach((el) => {
			if (this.has(el)) {
				returned.add(el);
			}
		});
		return returned;
	}

	/**
	 * Return the union (disjunction) of this set with the argument.
	 * @see xjs.Set.union
	 * @param   that the other set
	 * @returns a new SetEq containing the elements present in either `this` or `that` (or both)
	 */
	union(that: ReadonlySet<T>): SetEq<T> {
		const returned: SetEq<T> = new SetEq<T>(this.comparator, this);
		that.forEach((el) => {
			returned.add(el);
		});
		return returned
	}
}
