/**
 * A Result object resembles either a success or a failure.
 *
 * If it represents a success, it is an instance of `Ok` and it holds a `value`.
 * If it represents a failure, it is an instance of `Fail` and it holds a `reason`, which is an instance of Error.
 *
 * This class is **enumerated** — other than its enumerated subclasses, it must not be extended further.
 *
 * Known subclasses:
 * - Ok
 * - Fail
 *
 * @typeParam T : the type of the success value
 * @typeParam E : the type of the failure reason
 * @enum
 */
abstract class ResultBase<T, E extends Error = Error> {
	/* eslint-disable @typescript-eslint/no-use-before-define */
	/**
	 * Returns a new Result containing an array of the values of the given Results, if they are all instances of Ok or are non-`Result` objects.
	 * If any result is a Fail, returns a new Result containing that reason.
	 *
	 * This method short-circuits: if any array item is a Fail, the method returns without processing any further items.
	 * @typeParam S : the type of values in the array
	 * @typeParam X : the type of Error, if any, in the array
	 * @param results the results to unwrap
	 * @returns a new Ok containing the array of unwrapped success values, or a new Fail containing any unwrapped failure reason
	 */
	public static allOk<S, X extends Error = Error>(results: readonly (Result<S, X> | S)[]): Result<S[], X> {
		const values: S[] = [];
		for (const result of results) {
			if (result instanceof ResultFail) {
				return new ResultFail<S[], X>(result.reason);
			} else {
				values.push(result instanceof ResultOk ? result.value : result);
			}
		}
		return new ResultOk<S[], X>(values);
	}

	/**
	 * Returns a new Result containing the first successful value (or non-`Result` object) found in an array of Results.
	 * If all Results are Fails, returns a new Result containing an AggregateError of all the failure reasons.
	 *
	 * If an empty array is given, all its entries are vacuously Fails, and so this method returns a Fail containing a single Error.
	 *
	 * If an Ok is returned, it holds the “leftmost” (closest to start) value.
	 *
	 * This method short-circuits: if any array item is an Ok, the method returns without processing any further items.
	 * @typeParam S : the type of value, if any, in the array
	 * @typeParam X : the type of Errors, if any, in the array
	 * @param results the results to unwrap
	 * @returns a new Ok containing an unwrapped success value, or a new Fail containing an AggregateError of unwrapped failure reasons
	 */
	public static anyOk<S, X extends Error = Error>(results: readonly (Result<S, X> | S)[]): Result<S, AggregateError | Error> {
		if (!results.length) {
			return new ResultFail<S, Error>(new Error('All results in given empty array were failures.'));
		}
		const reasons: X[] = [];
		for (const result of results) {
			if (result instanceof ResultFail) {
				reasons.push(result.reason);
			} else {
				return new ResultOk<S, AggregateError>(result instanceof ResultOk ? result.value : result);
			}
		}
		return new ResultFail<S, AggregateError>(new AggregateError(reasons));
	}
	/* eslint-enable @typescript-eslint/no-use-before-define */


	/**
	 * Handle this Result’s success value, returning a new Result.
	 * @typeParam S     : the type of the new Result’s success value
	 * @param     on_ok : a function to be called on this Result’s success value
	 * @return            a new Result with the result of `on_ok`
	 */
	public abstract map<S = T>(on_ok: (value: T) => S): Result<S, E>;

	/**
	 * Handle this Result’s fail reason, returning a new Result.
	 * @typeParam X     : the type of the new Result’s fail reason
	 * @param     on_ex : a function to be called on this Result’s fail reason
	 * @return            a new Result with the result of `on_ex`
	 */
	public abstract catch<X extends Error = E>(on_ex: (reason: E) => X): Result<T, X>;

	/**
	 * Handle this Result’s success value, returning a new Result.
	 * The callback must return a Result instead of a success value;
	 * useful for fallible operations.
	 * If the callback is performed, this method returns the value returned by it.
	 * @typeParam S     : the type of the new Result’s success value
	 * @param     on_ok : a function to be called on this Result’s success value
	 * @return            a new Result with the result of `on_ok`
	 */
	public abstract flatMap<S = T>(on_ok: (value: T) => Result<S, E>): Result<S, E>;

	/**
	 * Handle this Result’s fail reason, returning a new Result.
	 * The callback must return a Result instead of a failure reason;
	 * useful for recoverable operations.
	 * If the callback is performed, this method returns the value returned by it.
	 * @typeParam X     : the type of the new Result’s fail reason
	 * @param     on_ex : a function to be called on this Result’s fail reason
	 * @return            a new Result with the result of `on_ex`
	 */
	public abstract flatCatch<X extends Error = E>(on_ex: (reason: E) => Result<T, X>): Result<T, X>;

	/**
	 * Extract this Result's success value, or throw if it is a failure.
	 * @returns the success value if this Result is an Ok
	 * @throws  the failure reason if this Result is a Fail
	 */
	public abstract unwrapOrPanic(): T;
}



/** @final */
class ResultOk<T, E extends Error = Error> extends ResultBase<T, E> {
	/**
	 * Construct a new Ok object.
	 * @param value the value held by the Ok
	 */
	public constructor(public readonly value: T) {
		super();
	}


	public override map<S = T>(on_ok: (value: T) => S): ResultOk<S, E> {
		return new ResultOk<S, E>(on_ok(this.value));
	}

	public override catch<X extends Error = E>(): ResultOk<T, X> {
		return new ResultOk<T, X>(this.value);
	}

	public override flatMap<S = T>(on_ok: (value: T) => Result<S, E>): Result<S, E> {
		return on_ok(this.value);
	}

	public override flatCatch<X extends Error = E>(): ResultOk<T, X> {
		return this.catch<X>();
	}

	public override unwrapOrPanic(): T {
		return this.value;
	}
}



/** @final */
class ResultFail<T, E extends Error = Error> extends ResultBase<T, E> {
	public static fromString<S>(message: string): ResultFail<S> {
		return new ResultFail<S>(new Error(message));
	}


	/**
	 * Construct a new Fail object.
	 * @param reason the reason held by the Fail
	 */
	public constructor(public readonly reason: E) {
		super();
	}


	public override map<S = T>(): ResultFail<S, E> {
		return new ResultFail<S, E>(this.reason);
	}

	public override catch<X extends Error = E>(on_ex: (reason: E) => X): ResultFail<T, X> {
		return new ResultFail<T, X>(on_ex(this.reason));
	}

	public override flatMap<S = T>(): ResultFail<S, E> {
		return this.map<S>();
	}

	public override flatCatch<X extends Error = E>(on_ex: (reason: E) => Result<T, X>): Result<T, X> {
		return on_ex(this.reason);
	}

	public override unwrapOrPanic(): never {
		throw this.reason;
	}
}



// HACK: TypeScript doesn’t handle pattern-matching with object inheritance well,
// so we’re using a type union combined with a namespace to represent the base class.
export type Result<T, E extends Error = Error> = ResultBase<T, E> & (ResultOk<T, E> | ResultFail<T, E>);
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Result {
	export const Ok = ResultOk;
	export const Fail = ResultFail;
	export const allOk = ResultBase.allOk.bind(undefined);
	export const anyOk = ResultBase.anyOk.bind(undefined);
}
