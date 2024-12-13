import {
	type Type,
	TypeIntersection,
	TypeUnion,
	TypeDifference,
	NEVER,
	VOID,
	UNKNOWN,
	NULL,
	BOOL,
	INT,
	FLOAT,
	STR,
	OBJ as TYPE_OBJ,
} from './index.js';



/** Memoizer for storing intersections of `Type`s. */
const AND_MEMO = new WeakMap<Type, WeakMap<Type, Type>>();
/** Memoizer for storing unions of `Type`s. */
const OR_MEMO  = new WeakMap<Type, WeakMap<Type, Type>>();
/** Memoizer for comparing `Type`s by subset. */
const SUB_MEMO = new WeakMap<Type, WeakMap<Type, boolean>>();



/**
 * Decorator for {@link Type#intersect} for memoizing results.
 * @implements MethodDecorator<Type, Type['intersect']>
 */
export function memoizeIntersection(
	method:   Type['intersect'],
	_context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	return function (this: Type, t) {
		if (AND_MEMO.has(this)) {
			const map: WeakMap<Type, Type> = AND_MEMO.get(this)!;
			map.has(t) || map.set(t, method.call(this, t));
			return map.get(t)!;
		} else if (AND_MEMO.has(t)) {
			const map: WeakMap<Type, Type> = AND_MEMO.get(t)!;
			map.has(this) || map.set(this, method.call(this, t));
			return map.get(this)!;
		} else {
			const map = new WeakMap<Type, Type>();
			AND_MEMO.set(this, map);
			const result: Type = method.call(this, t);
			map.set(t, result);
			return result;
		}
	};
}



/**
 * Decorator for {@link Type#union} for memoizing results.
 * @implements MethodDecorator<Type, Type['union']>
 */
export function memoizeUnion(
	method:   Type['union'],
	_context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	return function (this: Type, t) {
		if (OR_MEMO.has(this)) {
			const map: WeakMap<Type, Type> = OR_MEMO.get(this)!;
			map.has(t) || map.set(t, method.call(this, t));
			return map.get(t)!;
		} else if (OR_MEMO.has(t)) {
			const map: WeakMap<Type, Type> = OR_MEMO.get(t)!;
			map.has(this) || map.set(this, method.call(this, t));
			return map.get(this)!;
		} else {
			const map = new WeakMap<Type, Type>();
			OR_MEMO.set(this, map);
			const result: Type = method.call(this, t);
			map.set(t, result);
			return result;
		}
	};
}



/**
 * Decorator for {@link Type#isSubtypeOf} for memoizing results.
 * @implements MethodDecorator<Type, Type['isSubtypeOf']>
 */
export function memoizeSubtype(
	method:   Type['isSubtypeOf'],
	_context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	return function (this: Type, t) {
		SUB_MEMO.has(this) || SUB_MEMO.set(this, new WeakMap([[t, method.call(this, t)]]));
		const map: WeakMap<Type, boolean> = SUB_MEMO.get(this)!;
		map.has(t) || map.set(t, method.call(this, t));
		return map.get(t)!;
	};
}



/**
 * Decorator for some overrides of {@link Type#toString}.
 * Contains some special cases of string representations.
 * @implements MethodDecorator<Type, Type['toString']>
 */
export function toStringDeco(
	method: Type['toString'],
	_context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	return function (this: Type) {
		return (
			this.isBottomType ? NEVER  .toString() :
			this.isTopType    ? UNKNOWN.toString() :
			method.call(this)
		);
	};
}



/**
 * Decorator for any type binary operation.
 * Simplifies return values to values that already exist, if possible.
 * @implements MethodDecorator<Type, (t: Type) => Type>
 */
export function operatorDeco(
	method:   (t: Type) => Type,
	_context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	return function (this: Type, t) {
		const returned: Type = method.call(this, t);
		return (
			returned.isBottomType ? NEVER :
			returned.isTopType    ? UNKNOWN :
			[
				VOID,
				NULL,
				BOOL,
				INT,
				FLOAT,
				STR,
				TYPE_OBJ,
			].find((c) => returned.equals(c)) ?? returned
		);
	};
}



/**
 * Decorator for {@link Type#intersect} method and any overrides.
 * Contains shortcuts for constructing type intersections.
 * @implements MethodDecorator<Type, Type['intersect']>
 */
export function intersectDeco(
	method:   Type['intersect'],
	_context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	return function (this: Type, t) {
		/* 1-5 | `T  & never   == never` */
		if (this.isBottomType || t.isBottomType) {
			return NEVER;
		}
		/* 1-6 | `T  & unknown == T` */
		if (this.isTopType) {
			return t;
		}
		if (t.isTopType) {
			return this;
		}
		/* 3-3 | `A <: B  <->  A  & B == A` */
		if (this.isSubtypeOf(t)) {
			return this;
		}
		if (t.isSubtypeOf(this)) {
			return t;
		}

		return method.call(this, t);
	};
}



/**
 * Decorator for {@link Type#union} method and any overrides.
 * Contains shortcuts for constructing type unions.
 * @implements MethodDecorator<Type, Type['union']>
 */
export function unionDeco(
	method:   Type['union'],
	_context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	return function (this: Type, t) {
		/* 1-7 | `T \| never   == T` */
		if (this.isBottomType) {
			return t;
		}
		if (t.isBottomType) {
			return this;
		}
		/* 1-8 | `T \| unknown == unknown` */
		if (this.isTopType || t.isTopType) {
			return UNKNOWN;
		}
		/* 3-4 | `A <: B  <->  A \| B == B` */
		if (this.isSubtypeOf(t)) {
			return t;
		}
		if (t.isSubtypeOf(this)) {
			return this;
		}

		return method.call(this, t);
	};
}



/**
 * Decorator for {@link Type#subtract} method and any overrides.
 * Contains shortcuts for constructing type differences.
 * @implements MethodDecorator<Type, Type['subtract']>
 */
export function subtractDeco(
	method:   Type['subtract'],
	_context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	return function (this: Type, t) {
		/* 4-1 | `A - B == A  <->  A & B == never` */
		if (this.intersect(t).isBottomType) {
			return this;
		}

		/* 4-2 | `A - B == never  <->  A <: B` */
		if (this.isSubtypeOf(t)) {
			return NEVER;
		}

		/* 4-5 | `A - (B \| C) == (A - B)  & (A - C)` */
		if (t instanceof TypeUnion) {
			return TypeIntersection.all(t.operands.map((s) => this.subtract(s)));
		}

		return method.call(this, t);
	};
}



/**
 * Decorator for {@link Type#isSubtypeOf} method and any overrides.
 * Contains shortcuts for determining subtypes.
 * @implements MethodDecorator<Type, Type['isSubtypeOf']>
 */
export function subtypeDeco(
	method:   Type['isSubtypeOf'],
	_context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	return function (this: Type, t) {
		/* 2-7 | `A <: A` */
		if (this === t) {
			return true;
		}
		/* 1-1 | `never <: T` */
		if (this.isBottomType) {
			return true;
		}
		/* 1-3 | `T       <: never  <->  T == never` */
		if (t.isBottomType) {
			return this.isBottomType;
		}
		/* 1-4 | `unknown <: T      <->  T == unknown` */
		if (this.isTopType) {
			return t.isTopType;
		}
		/* 1-2 | `T     <: unknown` */
		if (t.isTopType) {
			return true;
		}

		/*
		 * Denormalize intersection/union types.
		 *
		 * An assignee of intersection type `A & (B | C)` will attempt to convert to `(A & B) | (A & C)`
		 * when being assigned a value.
		 * A type union in this case is more performant, as only one constituent of the union is sufficient —
		 * the value only need be assignable to `A & B` or `A & C`, which allows for short-circuiting.
		 *
		 * Likewise, when a value is of union type `A | (B & C)`, it will attempt to convert to `(A | B) & (A | C)`
		 * when being assigned to a target.
		 * In this scenario, a type intersection can allow for short-circuiting —
		 * only one of the constituents `A | B` or `A | C` need be assignable.
		 *
		 * Inspiration: https://devblogs.microsoft.com/typescript/announcing-typescript-5-3/#optimizations-by-comparing-non-normalized-intersections
		 */
		if (t instanceof TypeIntersection) {
			const maybe_union: Type = t.denormalize();
			if (maybe_union instanceof TypeUnion && this.isSubtypeOf(maybe_union)) {
				return true;
			}
		}
		if (this instanceof TypeUnion) {
			const maybe_intersection: Type = this.denormalize();
			if (maybe_intersection instanceof TypeIntersection && maybe_intersection.isSubtypeOf(t)) {
				return true;
			}
		}

		if (t instanceof TypeIntersection) {
			/*
			 * 3-1 | `A  & B <: A  &&  A  & B <: B`
			 *     | `A  & B  & C <: A  & B`
			 */
			if (this instanceof TypeIntersection && t.operands.every((s) => this.operands.some((r) => r.equals(s)))) {
				return true;
			}
			/* 3-5 | `A <: C    &&  A <: D  <->  A <: C  & D` */
			return t.operands.every((s) => this.isSubtypeOf(s));
		}
		if (t instanceof TypeUnion) {
			/*
			 * 3-2 | `A <: A \| B  &&  B <: A \| B`
			 *     | `A \| B <: A \| B \| C`
			 */
			if (this instanceof TypeUnion && this.operands.every((s) => t.operands.some((r) => r.equals(s)))) {
				return true;
			}
			/* 3-6 | `A <: C  \|\|  A <: D  -->  A <: C \| D` */
			if (t.operands.some((s) => this.isSubtypeOf(s))) {
				return true;
			}
			/* 3-2 | `A <: A \| B  &&  B <: A \| B` */
			if (t.operands.some((s) => this.equals(s))) {
				return true;
			}
		}
		/* 4-3 | `A <: B - C  <->  A <: B  &&  A & C == never` */
		if (t instanceof TypeDifference) {
			return this.isSubtypeOf(t.left) && this.intersect(t.right).isBottomType;
		}

		return method.call(this, t);
	};
}
