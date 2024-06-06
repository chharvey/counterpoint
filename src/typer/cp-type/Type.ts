import * as xjs from 'extrajs';
import {strictEqual} from '../../lib/index.js';
import {languageValuesIdentical} from '../utils-private.js';
import type * as OBJ from '../cp-object/index.js';
import {
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



/**
 * Parent class for all Counterpoint Language Types.
 * Known subclasses:
 * - Combinable
 * - TypeDifference
 * - TypeUnit
 * - TypeInterface
 * - TypeNever
 * - TypeVoid
 * - TypeUnknown
 * - TypeBoolean
 * - TypeInteger
 * - TypeFloat
 * - TypeString
 * - TypeObject
 * - TypeTuple
 * - TypeRecord
 * - TypeList
 * - TypeDict
 * - TypeSet
 * - TypeMap
 */
export abstract class Type {
	/** Memoizer for storing intersections of `Type`s. */
	private static readonly AND_MEMO = new WeakMap<Type, WeakMap<Type, Type>>();
	/** Memoizer for storing unions of `Type`s. */
	private static readonly OR_MEMO  = new WeakMap<Type, WeakMap<Type, Type>>();
	/** Memoizer for comparing `Type`s by subset. */
	private static readonly SUB_MEMO = new WeakMap<Type, WeakMap<Type, boolean>>();

	/**
	 * Decorator for {@link Type#intersect} for memoizing results.
	 * @implements MethodDecorator<Type, Type['intersect']>
	 */
	protected static memoizeIntersection(
		method:   Type['intersect'],
		_context: ClassMethodDecoratorContext<Type, typeof method>,
	): typeof method {
		return function (this: Type, t) {
			if (Type.AND_MEMO.has(this)) {
				const map: WeakMap<Type, Type> = Type.AND_MEMO.get(this)!;
				map.has(t) || map.set(t, method.call(this, t));
				return map.get(t)!;
			} else if (Type.AND_MEMO.has(t)) {
				const map: WeakMap<Type, Type> = Type.AND_MEMO.get(t)!;
				map.has(this) || map.set(this, method.call(this, t));
				return map.get(this)!;
			} else {
				const map = new WeakMap<Type, Type>();
				Type.AND_MEMO.set(this, map);
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
	protected static memoizeUnion(
		method:   Type['union'],
		_context: ClassMethodDecoratorContext<Type, typeof method>,
	): typeof method {
		return function (this: Type, t) {
			if (Type.OR_MEMO.has(this)) {
				const map: WeakMap<Type, Type> = Type.OR_MEMO.get(this)!;
				map.has(t) || map.set(t, method.call(this, t));
				return map.get(t)!;
			} else if (Type.OR_MEMO.has(t)) {
				const map: WeakMap<Type, Type> = Type.OR_MEMO.get(t)!;
				map.has(this) || map.set(this, method.call(this, t));
				return map.get(this)!;
			} else {
				const map = new WeakMap<Type, Type>();
				Type.OR_MEMO.set(this, map);
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
	protected static memoizeSubtype(
		method:   Type['isSubtypeOf'],
		_context: ClassMethodDecoratorContext<Type, typeof method>,
	): typeof method {
		return function (this: Type, t) {
			Type.SUB_MEMO.has(this) || Type.SUB_MEMO.set(this, new WeakMap([[t, method.call(this, t)]]));
			const map: WeakMap<Type, boolean> = Type.SUB_MEMO.get(this)!;
			map.has(t) || map.set(t, method.call(this, t));
			return map.get(t)!;
		};
	}

	/**
	 * Decorator for some overrides of {@link Type#toString}.
	 * Contains some special cases of string representations.
	 * @implements MethodDecorator<Type, Type['toString']>
	 */
	protected static toStringDeco(
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
	protected static operatorDeco(
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
	protected static intersectDeco(
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
	protected static unionDeco(
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
	protected static subtractDeco(
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
	protected static subtypeDeco(
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


	/**
	 * Construct a new Type object.
	 * @param isMutable Whether this type is mutable. Mutable objects may change fields/entries and call mutating methods.
	 * @param values    An enumerated set of values that are assignable to this type.
	 */
	public constructor(
		public readonly isMutable: boolean,
		public readonly values:    ReadonlySet<OBJ.Object> = new Set(),
	) {
	}

	/**
	 * Return whether this type has no values assignable to it,
	 * i.e., it is equal to the type `never`.
	 * Used internally for special cases of computations.
	 * @return `true if this type is the bottom type
	 */
	public get isBottomType(): boolean {
		return false;
	}

	/**
	 * Return whether this type has all values assignable to it,
	 * i.e., it is equal to the type `unknown`.
	 * Used internally for special cases of computations.
	 * @return `true if this type is the top type
	 */
	public get isTopType(): boolean {
		return false;
	}

	/**
	 * Return whether this type is a reference type or a value type.
	 * @return `true` if this type is a reference type
	 */
	public get isReference(): boolean {
		return true;
	}

	/**
	 * Return whether this type is mutable or has a mutable operand or component.
	 * @return `true` if this type is mutable or has a mutable operand/component
	 */
	public get hasMutable(): boolean {
		return this.isMutable;
	}

	/**
	 * Return whether this type “includes” the value, i.e.,
	 * whether the value is assignable to this type.
	 * @param v the value to check
	 * @returns Is `v` assignable to this type?
	 */
	public includes(v: OBJ.Object): boolean {
		return xjs.Set.has(this.values, v, languageValuesIdentical);
	}

	/**
	 * Return the type intersection of this type with another.
	 * @param t the other type
	 * @returns the type intersection
	 */
	@Type.memoizeIntersection
	@Type.operatorDeco
	@Type.intersectDeco
	public intersect(t: Type): Type {
		/* 2-1 | `A  & B == B  & A` */
		if (t instanceof TypeIntersection) {
			return t.intersect(this);
		}
		return new TypeIntersection(this, t).normalize();
	}

	/**
	 * Return the type union of this type with another.
	 * @param t the other type
	 * @returns the type union
	 */
	@Type.memoizeUnion
	@Type.operatorDeco
	@Type.unionDeco
	public union(t: Type): Type {
		/* 2-2 | `A \| B == B \| A` */
		if (t instanceof TypeUnion) {
			return t.union(this);
		}
		return new TypeUnion(this, t).normalize();
	}

	/**
	 * Return a new type that includes the values in this type that are not included in the argument type.
	 * @param t the other type
	 * @returns the type difference
	 */
	@Type.operatorDeco
	@Type.subtractDeco
	public subtract(t: Type): Type {
		return new TypeDifference(this, t);
	}

	/**
	 * Return whether this type is a structural subtype of the given type.
	 * @param t the type to compare
	 * @returns Is this type a subtype of the argument?
	 */
	@strictEqual
	@Type.memoizeSubtype
	@Type.subtypeDeco
	public isSubtypeOf(t: Type): boolean {
		return !this.isBottomType && !!this.values.size // these checks are needed in cases of `Object` and `void`, which don’t store values
			&& [...this.values].every((v) => t.includes(v));
	}

	/**
	 * Return whether this type is structurally equal to the given type.
	 * Two types are structurally equal if they are subtypes of each other.
	 *
	 * 2-8 | `A <: B  &&  B <: A  -->  A == B`
	 * @param t the type to compare
	 * @returns Is this type equal to the argument?
	 */
	@strictEqual
	public equals(t: Type): boolean {
		return this.isMutable === t.isMutable && this.isSubtypeOf(t) && t.isSubtypeOf(this);
	}

	public mutableOf(): Type {
		return this;
	}

	public immutableOf(): Type {
		return this;
	}
}



/**
 * An Interface Type is a set of properties that a value must have.
 */
export class TypeInterface extends Type {
	/**
	 * Construct a new TypeInterface object.
	 * @param properties a map of this type’s members’ names along with their associated types
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		private readonly properties: ReadonlyMap<string, Type>,
		is_mutable: boolean = false,
	) {
		super(is_mutable);
	}

	public override get isBottomType(): boolean {
		return [...this.properties.values()].some((value) => value.isBottomType);
	}

	public override get isTopType(): boolean {
		return this.properties.size === 0;
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || [...this.properties.values()].some((t) => t.hasMutable);
	}

	public override includes(v: OBJ.Object): boolean {
		return [...this.properties.keys()].every((key) => key in v);
	}

	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type intersection is taken.
	 */
	@Type.operatorDeco
	@Type.intersectDeco
	public override intersect(t: Type): Type {
		if (t instanceof TypeInterface) {
			const props = new Map<string, Type>([...this.properties]);
			[...t.properties].forEach(([name, type_]) => {
				props.set(name, (props.has(name)) ? props.get(name)!.intersect(type_) : type_);
			});
			return new TypeInterface(props);
		} else {
			return super.intersect(t);
		}
	}

	/**
	 * The *union* of types `S` and `T` is the *intersection* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type union is taken.
	 */
	@Type.memoizeUnion
	@Type.operatorDeco
	@Type.unionDeco
	public override union(t: Type): Type {
		if (t instanceof TypeInterface) {
			const props = new Map<string, Type>();
			[...this.properties].forEach(([name, type_]) => {
				if (t.properties.has(name)) {
					props.set(name, type_.union(t.properties.get(name)!));
				}
			});
			return new TypeInterface(props);
		} else {
			return super.union(t);
		}
	}

	/**
	 * In the general case, `S` is a subtype of `T` if every property of `T` exists in `S`,
	 * and for each of those properties `#prop`, the type of `S#prop` is a subtype of `T#prop`.
	 * In other words, `S` is a subtype of `T` if the set of properties on `T` is a subset of the set of properties on `S`.
	 */
	@strictEqual
	@Type.memoizeSubtype
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		if (t instanceof TypeInterface) {
			return [...t.properties].every(([name, type_]) => (
				this.properties.has(name) && this.properties.get(name)!.isSubtypeOf(type_)
			));
		} else {
			return super.isSubtypeOf(t);
		}
	}

	public override mutableOf(): TypeInterface {
		return new TypeInterface(this.properties, true);
	}

	public override immutableOf(): TypeInterface {
		return new TypeInterface(this.properties, false);
	}
}
