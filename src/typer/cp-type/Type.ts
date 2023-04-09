import * as assert from 'assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {BinEither} from '../../index.js';
import {
	throw_expression,
	memoizeMethod,
	strictEqual,
} from '../../lib/index.js';
import {languageValuesIdentical} from '../utils-private.js';
import * as OBJ from '../cp-object/index.js';
import {
	TypeIntersection,
	TypeUnion,
	TypeDifference,
	TypeUnit,
	NEVER,
	VOID,
	UNKNOWN,
	NULL,
	BOOL,
	INT,
	FLOAT,
} from './index.js';



/**
 * Parent class for all Counterpoint Language Types.
 * Known subclasses:
 * - TypeIntersection
 * - TypeUnion
 * - TypeDifference
 * - TypeUnit
 * - TypeInterface
 * - TypeNever
 * - TypeVoid
 * - TypeUnknown
 * - TypeObject
 * - TypeBoolean
 * - TypeInteger
 * - TypeFloat
 * - TypeString
 * - TypeTuple
 * - TypeRecord
 * - TypeList
 * - TypeDict
 * - TypeSet
 * - TypeMap
 */
export abstract class Type {
	/**
	 * Decorator for {@link Type#intersect} method and any overrides.
	 * Contains shortcuts for constructing type intersections.
	 * @implements MethodDecorator<Type, (this: Type, t: Type) => Type>
	 */
	protected static intersectDeco(
		method:   (this: Type, t: Type) => Type,
		_context: ClassMethodDecoratorContext<Type, typeof method>,
	): typeof method {
		return function (t) {
			/** 1-5 | `T  & never   == never` */
			if (this.isBottomType || t.isBottomType) {
				return NEVER;
			}
			/** 1-6 | `T  & unknown == T` */
			if (this.isTopType) {
				return t;
			}
			if (t.isTopType) {
				return this;
			}
			/** 3-3 | `A <: B  <->  A  & B == A` */
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
	 * @implements MethodDecorator<Type, (this: Type, t: Type) => Type>
	 */
	protected static unionDeco(
		method:   (this: Type, t: Type) => Type,
		_context: ClassMethodDecoratorContext<Type, typeof method>,
	): typeof method {
		return function (t) {
			/** 1-7 | `T \| never   == T` */
			if (this.isBottomType) {
				return t;
			}
			if (t.isBottomType) {
				return this;
			}
			/** 1-8 | `T \| unknown == unknown` */
			if (this.isTopType || t.isTopType) {
				return UNKNOWN;
			}
			/** 3-4 | `A <: B  <->  A \| B == B` */
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
	 * @implements MethodDecorator<Type, (this: Type, t: Type) => Type>
	 */
	protected static subtractDeco(
		method:   (this: Type, t: Type) => Type,
		_context: ClassMethodDecoratorContext<Type, typeof method>,
	): typeof method {
		return function (t) {
			/** 4-1 | `A - B == A  <->  A & B == never` */
			if (this.intersect(t).isBottomType) {
				return this;
			}

			/** 4-2 | `A - B == never  <->  A <: B` */
			if (this.isSubtypeOf(t)) {
				return NEVER;
			}

			if (t instanceof TypeUnion) {
				return t.subtractedFrom(this);
			}

			return method.call(this, t);
		};
	}

	/**
	 * Decorator for {@link Type#isSubtypeOf} method and any overrides.
	 * Contains shortcuts for determining subtypes.
	 * @implements MethodDecorator<Type, (this: Type, t: Type) => boolean>
	 */
	protected static subtypeDeco(
		method:   (this: Type, t: Type) => boolean,
		_context: ClassMethodDecoratorContext<Type, typeof method>,
	): typeof method {
		return function (t) {
			/** 2-7 | `A <: A` */
			if (this === t) {
				return true;
			}
			/** 1-1 | `never <: T` */
			if (this.isBottomType) {
				return true;
			}
			/** 1-3 | `T       <: never  <->  T == never` */
			if (t.isBottomType) {
				return this.isBottomType;
			}
			/** 1-4 | `unknown <: T      <->  T == unknown` */
			if (this.isTopType) {
				return t.isTopType;
			}
			/** 1-2 | `T     <: unknown` */
			if (t.isTopType) {
				return true;
			}

			if (t instanceof TypeIntersection) {
				return t.isSupertypeOf(this);
			}
			if (t instanceof TypeUnion) {
				if (t.isNecessarilySupertypeOf(this)) {
					return true;
				}
			}
			if (t instanceof TypeDifference) {
				return t.isSupertypeOf(this);
			}

			return method.call(this, t);
		};
	}

	/**
	 * Intersect all the given types.
	 * If an empty array is given, return type `never`.
	 * @param types the types to intersect
	 * @returns the intersection
	 */
	public static intersectAll(types: readonly Type[]): Type {
		return (types.length) ? types.reduce((a, b) => a.intersect(b)) : NEVER;
	}

	/**
	 * Unions all the given types.
	 * If an empty array is given, return type `never`.
	 * @param types the types to union
	 * @returns the union
	 */
	public static unionAll(types: readonly Type[]): Type {
		return (types.length) ? types.reduce((a, b) => a.union(b)) : NEVER;
	}


	/**
	 * Whether this type has no values assignable to it,
	 * i.e., it is equal to the type `never`.
	 * Used internally for special cases of computations.
	 */
	public readonly isBottomType: boolean = this.values.size === 0;
	/**
	 * Whether this type has all values assignable to it,
	 * i.e., it is equal to the type `unknown`.
	 * Used internally for special cases of computations.
	 */
	public readonly isTopType: boolean = false;

	/**
	 * Construct a new Type object.
	 * @param isMutable Whether this type is `mutable`. Mutable objects may change fields/entries and call mutating methods.
	 * @param values    An enumerated set of values that are assignable to this type.
	 */
	public constructor(
		public readonly isMutable: boolean,
		public readonly values:    ReadonlySet<OBJ.Object> = new Set(),
	) {
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
	@Type.intersectDeco
	public intersect(t: Type): Type {
		/** 2-1 | `A  & B == B  & A` */
		if (t instanceof TypeUnion) {
			return t.intersect(this);
		}

		return new TypeIntersection(this, t);
	}

	/**
	 * Return the type union of this type with another.
	 * @param t the other type
	 * @returns the type union
	 */
	@Type.unionDeco
	public union(t: Type): Type {
		/** 2-2 | `A \| B == B \| A` */
		if (t instanceof TypeIntersection) {
			return t.union(this);
		}

		return new TypeUnion(this, t);
	}

	/**
	 * Return a new type that includes the values in this type that are not included in the argument type.
	 * @param t the other type
	 * @returns the type difference
	 */
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
	@Type.subtypeDeco
	public isSubtypeOf(t: Type): boolean {
		return !this.isBottomType && !!this.values.size // these checks are needed in cases of `obj` and `void`, which don’t store values
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

	/**
	 * Return a corresponding Binaryen type.
	 * @return the best match for a Binaryen type equivalent to this type
	 * @final
	 */
	@memoizeMethod
	public binType(): binaryen.Type {
		const is_bin_int: boolean = (
			   this.equals(NULL)
			|| this.equals(BOOL) || this.equals(OBJ.Boolean.FALSETYPE) || this.equals(OBJ.Boolean.TRUETYPE)
			|| this.equals(INT) || (this instanceof TypeUnit && this.value instanceof OBJ.Integer)
		);
		const is_bin_float: boolean = this.equals(FLOAT) || (this instanceof TypeUnit && this.value instanceof OBJ.Float);
		return (
			(this.isBottomType) ? binaryen.unreachable :
			(this.equals(VOID)) ? binaryen.none        :
			(is_bin_int)        ? binaryen.i32         :
			(is_bin_float)      ? binaryen.f64         :
			(this instanceof TypeUnion) ? ((left_type: binaryen.Type, right_type: binaryen.Type): binaryen.Type => {
				assert.notStrictEqual(left_type,  binaryen.unreachable);
				assert.notStrictEqual(right_type, binaryen.unreachable);
				if (left_type === binaryen.none) {
					left_type = right_type;
				}
				if (right_type === binaryen.none) {
					right_type = left_type;
				}
				return BinEither.createType(left_type, right_type);
			})(this.left.binType(), this.right.binType()) :
			throw_expression(new TypeError(`Translation from \`${ this }\` to a binaryen type is not yet supported.`))
		);
	}

	/**
	 * @return a default Binaryen value given this type
	 */
	public defaultBinValue(mod: binaryen.Module): binaryen.ExpressionRef {
		return (
			(this.binType() === binaryen.i32) ? mod.i32.const(0) :
			(this.binType() === binaryen.f64) ? mod.f64.const(0) :
			(this instanceof TypeUnion)       ? new BinEither(mod, 0n, this.left.defaultBinValue(mod), this.right.defaultBinValue(mod)).make() :
			throw_expression(new TypeError(`Could not determine a default value for \`${ this }\`.`))
		);
	}
}



/**
 * An Interface Type is a set of properties that a value must have.
 */
export class TypeInterface extends Type {
	public override readonly isBottomType: boolean = [...this.properties.values()].some((value) => value.isBottomType);
	public override readonly isTopType:    boolean = this.properties.size === 0;

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
