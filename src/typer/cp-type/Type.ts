import * as xjs from 'extrajs';
import {
	assert_context_name,
	memoizeGetter,
} from '../../lib/index.ts';
import {
	languageValuesIdentical,
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import type * as VALUE from '../cp-value/index.ts';
import {
	Intersection,
	Union,
	Difference,
	NEVER,
	UNKNOWN,
	NULL,
	BOOL,
	SYM,
	INT,
	FLOAT,
	STR,
	OBJ,
	FALSE,
	TRUE,
	SYM_NEVER,
	FALSY_TYPES,
} from './index.ts';



/**
 * Decorator for any type binary operation.
 * Simplifies return values to values that already exist, if possible.
 * @implements MethodDecorator<Type, (t: Type) => Type>
 */
export function typeConstant(
	method:   (t: Type) => Type,
	_context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	return function (this: Type, t) {
		const returned: Type = method.call(this, t);
		return (
			returned.isBottomType ? NEVER :
			returned.isTopType    ? UNKNOWN :
			[
				NULL,
				BOOL,
				SYM,
				INT,
				FLOAT,
				STR,
				OBJ,
				FALSE,
				TRUE,
				SYM_NEVER,
			].find((c) => returned.equals(c)) ?? returned
		);
	};
}



/**
 * Decorator for {@link Type#intersect} method and any overrides.
 * Contains shortcuts for constructing type intersections.
 * @implements MethodDecorator<Type, Type['intersect']>
 */
export function intersectionRules(
	method:  Type['intersect'],
	context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	assert_context_name(context, 'intersect');
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
export function unionRules(
	method:  Type['union'],
	context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	assert_context_name(context, 'union');
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
export function differenceRules(
	method:  Type['subtract'],
	context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	assert_context_name(context, 'subtract');
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
		if (t instanceof Union) {
			return Intersection.all(t.operands.map((s) => this.subtract(s)));
		}

		return method.call(this, t);
	};
}



/**
 * Decorator for {@link Type#isSubtypeOf} method and any overrides.
 * Contains shortcuts for determining subtypes.
 * @implements MethodDecorator<Type, Type['isSubtypeOf']>
 */
export function subtypeRules(
	method:  Type['isSubtypeOf'],
	context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	assert_context_name(context, 'isSubtypeOf');
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
		if (t instanceof Intersection) {
			const maybe_union: Type = t.denormalize();
			if (maybe_union instanceof Union && this.isSubtypeOf(maybe_union)) {
				return true;
			}
		}
		if (this instanceof Union) {
			const maybe_intersection: Type = this.denormalize();
			if (maybe_intersection instanceof Intersection && maybe_intersection.isSubtypeOf(t)) {
				return true;
			}
		}

		if (t instanceof Intersection) {
			/*
			 * 3-1 | `A  & B <: A  &&  A  & B <: B`
			 *     | `A  & B  & C <: A  & B`
			 */
			if (this instanceof Intersection && t.operands.every((s) => this.operands.some((r) => r.equals(s)))) {
				return true;
			}
			/* 3-5 | `A <: C    &&  A <: D  <->  A <: C  & D` */
			return t.operands.every((s) => this.isSubtypeOf(s));
		}
		if (t instanceof Union) {
			/*
			 * 3-2 | `A <: A \| B  &&  B <: A \| B`
			 *     | `A \| B <: A \| B \| C`
			 */
			if (this instanceof Union && this.operands.every((s) => t.operands.some((r) => r.equals(s)))) {
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
		if (t instanceof Difference) {
			return this.isSubtypeOf(t.left) && this.intersect(t.right).isBottomType;
		}

		return method.call(this, t);
	};
}



/**
 * Parent class for all Counterpoint Language Types.
 * Known subclasses:
 * - TypeOperation
 * - ValueType
 * - TypeInterface
 * - ReferenceType
 */
export abstract class Type {
	/**
	 * Construct a new Type object.
	 * @param isMutable Whether this type is mutable. Mutable objects may change fields/entries and call mutating methods.
	 * @param values    An enumerated set of values that are assignable to this type.
	 */
	public constructor(
		public readonly isMutable: boolean,
		public readonly values:    ReadonlySet<VALUE.Value> = new Set(),
	) {
	}

	/**
	 * Return whether this type has no values assignable to it,
	 * i.e., it is equal to the type `never`.
	 * Used internally for special cases of computations.
	 * @return `true if this type is the bottom type
	 */
	// eslint-disable-next-line @typescript-eslint/class-literal-property-style --- overridden in subclasses by getters
	public get isBottomType(): boolean {
		return false;
	}

	/**
	 * Return whether this type has all values assignable to it,
	 * i.e., it is equal to the type `unknown`.
	 * Used internally for special cases of computations.
	 * @return `true if this type is the top type
	 */
	// eslint-disable-next-line @typescript-eslint/class-literal-property-style --- overridden in subclasses by getters
	public get isTopType(): boolean {
		return false;
	}

	/**
	 * Return whether this type is a reference type or a value type.
	 * @return `true` if this type is a reference type
	 */
	public abstract get isReference(): boolean;

	/**
	 * Return whether this type is mutable or has a mutable operand or component.
	 * @return `true` if this type is mutable or has a mutable operand/component
	 */
	public get hasMutable(): boolean {
		return this.isMutable;
	}

	/**
	 * @return a string representation of this type
	 */
	public abstract toString(): string;

	/**
	 * Is this type definitely a ”falsy” type?
	 * @return  whether this is a subtype of `null | false`
	 * @final
	 */
	@memoizeGetter
	public get isDefinitelyFalsy(): boolean {
		return this.isSubtypeOf(Union.all(...FALSY_TYPES));
	}

	/**
	 * Is this type definitely a “truthy” type?
	 * @return  `false` if this is the Bottom Type or is a supertype of any of `null` or `false`; otherwise `true`
	 * @final
	 */
	@memoizeGetter
	public get isDefinitelyTruthy(): boolean {
		return !this.isBottomType && [...FALSY_TYPES].every((t) => !t.isSubtypeOf(this));
	}

	/**
	 * Returns the “falsy side” of this type.
	 * @return this type’s intersection with all falsy types
	 * @final
	 */
	@memoizeGetter
	public get falsySide(): Type {
		return (
			this.isDefinitelyFalsy  ? this :
			this.isDefinitelyTruthy ? NEVER :
			this.intersect(Union.all(...FALSY_TYPES))
		);
	}

	/**
	 * Returns the “truthy side” of this type.
	 * @return this type, minus all falsy types
	 * @final
	 */
	@memoizeGetter
	public get truthySide(): Type {
		return (
			this.isDefinitelyFalsy  ? NEVER :
			this.isDefinitelyTruthy ? this :
			this.subtract(Union.all(...FALSY_TYPES))
		);
	}

	/**
	 * Return whether this type “includes” the value, i.e.,
	 * whether the value is assignable to this type.
	 * @param v the value to check
	 * @returns Is `v` assignable to this type?
	 */
	public includes(v: VALUE.Value): boolean {
		return xjs.Set.has(this.values, v, languageValuesIdentical);
	}

	/**
	 * Return the type intersection of this type with another.
	 * @param t the other type
	 * @returns the type intersection
	 */
	@memoizeBinOp(true)
	@typeConstant
	@intersectionRules
	public intersect(t: Type): Type {
		/* 2-1 | `A  & B == B  & A` */
		if (t instanceof Intersection) {
			return t.intersect(this);
		}
		return new Intersection(this, t).normalize();
	}

	/**
	 * Return the type union of this type with another.
	 * @param t the other type
	 * @returns the type union
	 */
	@memoizeBinOp(true)
	@typeConstant
	@unionRules
	public union(t: Type): Type {
		/* 2-2 | `A \| B == B \| A` */
		if (t instanceof Union) {
			return t.union(this);
		}
		return new Union(this, t).normalize();
	}

	/**
	 * Return a new type that includes the values in this type that are not included in the argument type.
	 * @param t the other type
	 * @returns the type difference
	 */
	@typeConstant
	@differenceRules
	public subtract(t: Type): Type {
		return new Difference(this, t);
	}

	/**
	 * Return whether this type is a structural subtype of the given type.
	 * @param t the type to compare
	 * @returns Is this type a subtype of the argument?
	 */
	@strictEqual
	@memoizeBinOp()
	@subtypeRules
	public isSubtypeOf(t: Type): boolean {
		return [...this.values].every((v) => t.includes(v));
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
	@memoizeBinOp(true)
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
 * @deprecated
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

	public override get isReference(): boolean {
		return true;
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || [...this.properties.values()].some((t) => t.hasMutable);
	}

	public override toString(): string {
		return `[${ [...this.properties].map((prop) => prop.join(': ')).join(', ') }]`;
	}

	public override includes(v: VALUE.Value): boolean {
		return [...this.properties.keys()].every((key) => key in v);
	}

	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type intersection is taken.
	 */
	@memoizeBinOp(true)
	@typeConstant
	@intersectionRules
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
	@memoizeBinOp(true)
	@typeConstant
	@unionRules
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
	@memoizeBinOp()
	@subtypeRules
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
