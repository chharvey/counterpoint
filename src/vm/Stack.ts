/**
 * A Stack is a LIFO (last in, first out) ordered list abstract data type.
 * Items can be added to the list, but only at the end (or “top”),
 * and items can be removed from the list, but also only from the end.
 * Thus when removing items, the first item removed is the last item added.
 * The order of items stored in the list is the order they were inserted.
 * @typeparam T the type of items in this Stack
 * @see https://dev.to/jimsy/building-a-stack-based-virtual-machine-part-2---the-stack-d07
 */
export class Stack<T> {
	/** Internal implemenation of this Stack’s data. */
	private readonly array: T[] = [];

	/**
	 * Construct a new Stack object.
	 */
	constructor () {
	}

	/**
	 * Is this Stack empty?
	 * @return `true` if this Stack contains no items
	 */
	get isEmpty(): boolean {
		return this.array.length === 0;
	}

	/**
	 * Look at the end (the “top”) of this Stack without modifying it.
	 * @return the item at the end of this Stack
	 * @throws if this Stack is empty
	 */
	peek(): T {
		if (this.isEmpty) {
			throw new Error('Cannot peek empty stack.')
		}
		return this.array[this.array.length - 1];
	}

	/**
	 * Add an item to this Stack.
	 * @param  item the item to push
	 * @return      `this`
	 */
	push(item: T): this {
		this.array.push(item);
		return this;
	}

	/**
	 * Remove the last item of this Stack, and return a tuple of both.
	 * @return a tuple of 2 items: (1) this Stack, minus the popped item, and (2) the popped item
	 * @throws if this Stack is empty
	 */
	pop(): [this, T] {
		if (this.isEmpty) {
			throw new Error('Cannot pop empty stack.');
		}
		return [this, this.array.pop()!];
	}
}
