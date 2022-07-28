import * as xjs from 'extrajs';
import {
	strictEqual,
	languageValuesIdentical,
	OBJ,
} from './package.js';
import {
	TypeIntersection,
	TypeUnion,
	TypeDifference,
	TypeUnit,
	TypeBoolean,
	TypeInteger,
	TypeFloat,
	TypeString,
	TypeObject,
} from './index.js';



/**
 * Parent class for all Counterpoint Language Types.
 * Known subclasses:
 * - TypeIntersection
 * - TypeUnion
 * - TypeDifference
 * - TypeInterface
 * - TypeNever
 * - TypeVoid
 * - TypeUnit
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
	/** The Bottom Type, containing no values. */                    static get NEVER():   TypeNever   { return TypeNever.INSTANCE; }
	/** The Void Type, representing a completion but not a value. */ static get VOID():    TypeVoid    { return TypeVoid.INSTANCE; }
	/** The Top Type, containing all values. */                      static get UNKNOWN(): TypeUnknown { return TypeUnknown.INSTANCE; }
	/** The Null Type. */                                            static get NULL():    TypeUnit    { return OBJ.Null.NULLTYPE; }
	/** The Boolean Type. */                                         static get BOOL():    TypeBoolean { return TypeBoolean.INSTANCE; }
	/** The Integer Type. */                                         static get INT():     TypeInteger { return TypeInteger.INSTANCE; }
	/** The Float Type. */                                           static get FLOAT():   TypeFloat   { return TypeFloat.INSTANCE; }
	/** The String Type. */                                          static get STR():     TypeString  { return TypeString.INSTANCE; }
	/** The Object Type. */                                          static get OBJ():     TypeObject  { return TypeObject.INSTANCE; }
	/**
	 * Decorator for {@link Type#intersect} method and any overrides.
	 * Contains shortcuts for constructing type intersections.
	 * @param   _prototype    the prototype that has the method to be decorated
	 * @param   _property_key the name of the method to be decorated
	 * @param   descriptor    the Property Descriptor of the prototype’s method
	 * @returns               `descriptor`, with a new value that is the decorated method
	 */
	protected static intersectDeco(
		_prototype: Type,
		_property_key: string,
		descriptor: TypedPropertyDescriptor<(this: Type, t: Type) => Type>,
	): typeof descriptor {
		const method = descriptor.value!;
		descriptor.value = function (t) {
			/** 1-5 | `T  & never   == never` */
			if (t.isBottomType) { return Type.NEVER; }
			if (this.isBottomType) { return this; }
			/** 1-6 | `T  & unknown == T` */
			if (t.isTopType) { return this; }
			if (this.isTopType) { return t; }

			/** 3-3 | `A <: B  <->  A  & B == A` */
			if (this.isSubtypeOf(t)) { return this }
			if (t.isSubtypeOf(this)) { return t }

			return method.call(this, t);
		};
		return descriptor;
	}
	/**
	 * Decorator for {@link Type#union} method and any overrides.
	 * Contains shortcuts for constructing type unions.
	 * @param   _prototype    the prototype that has the method to be decorated
	 * @param   _property_key the name of the method to be decorated
	 * @param   descriptor    the Property Descriptor of the prototype’s method
	 * @returns               `descriptor`, with a new value that is the decorated method
	 */
	protected static unionDeco(
		_prototype: Type,
		_property_key: string,
		descriptor: TypedPropertyDescriptor<(this: Type, t: Type) => Type>,
	): typeof descriptor {
		const method = descriptor.value!;
		descriptor.value = function (t) {
			/** 1-7 | `T \| never   == T` */
			if (t.isBottomType) { return this; }
			if (this.isBottomType) { return t; }
			/** 1-8 | `T \| unknown == unknown` */
			if (t.isTopType) { return t; }
			if (this.isTopType) { return Type.UNKNOWN; }

			/** 3-4 | `A <: B  <->  A \| B == B` */
			if (this.isSubtypeOf(t)) { return t }
			if (t.isSubtypeOf(this)) { return this }

			return method.call(this, t);
		};
		return descriptor;
	}
	/**
	 * Decorator for {@link Type#subtract} method and any overrides.
	 * Contains shortcuts for constructing type differences.
	 * @param   _prototype    the prototype that has the method to be decorated
	 * @param   _property_key the name of the method to be decorated
	 * @param   descriptor    the Property Descriptor of the prototype’s method
	 * @returns               `descriptor`, with a new value that is the decorated method
	 */
	protected static subtractDeco(
		_prototype: Type,
		_property_key: string,
		descriptor: TypedPropertyDescriptor<(this: Type, t: Type) => Type>,
	): typeof descriptor {
		const method = descriptor.value!;
		descriptor.value = function (t) {
			/** 4-1 | `A - B == A  <->  A & B == never` */
			if (this.intersect(t).isBottomType) { return this; }

			/** 4-2 | `A - B == never  <->  A <: B` */
			if (this.isSubtypeOf(t)) { return Type.NEVER; }

			if (t instanceof TypeUnion) {
				return t.subtractedFrom(this);
			}

			return method.call(this, t);
		};
		return descriptor;
	}
	/**
	 * Decorator for {@link Type#isSubtypeOf} method and any overrides.
	 * Contains shortcuts for determining subtypes.
	 * @param   _prototype    the prototype that has the method to be decorated
	 * @param   _property_key the name of the method to be decorated
	 * @param   descriptor    the Property Descriptor of the prototype’s method
	 * @returns               `descriptor`, with a new value that is the decorated method
	 */
	static subtypeDeco( // must be public because accessed in Object.ts
		_prototype: Type,
		_property_key: string,
		descriptor: TypedPropertyDescriptor<(this: Type, t: Type) => boolean>,
	): typeof descriptor {
		const method = descriptor.value!;
		descriptor.value = function (t) {
			/** 2-7 | `A <: A` */
			if (this === t) { return true };
			/** 1-1 | `never <: T` */
			if (this.isBottomType) { return true; }
			/** 1-3 | `T       <: never  <->  T == never` */
			if (t.isBottomType) { return this.isBottomType; }
			/** 1-4 | `unknown <: T      <->  T == unknown` */
			if (this.isTopType) { return t.isTopType; }
			/** 1-2 | `T     <: unknown` */
			if (t.isTopType) { return true; }

			if (t instanceof TypeIntersection) {
				return t.isSupertypeOf(this);
			}
			if (t instanceof TypeUnion) {
				if (t.isNecessarilySupertypeOf(this)) { return true; }
			}
			if (t instanceof TypeDifference) {
				return t.isSupertypeOf(this);
			}

			return method.call(this, t);
		};
		return descriptor;
	}
	/**
	 * Intersect all the given types.
	 * @param types the types to intersect
	 * @returns the intersection
	 */
	static intersectAll(types: Type[]): Type {
		return types.reduce((a, b) => a.intersect(b));
	}
	/**
	 * Unions all the given types.
	 * @param types the types to union
	 * @returns the union
	 */
	static unionAll(types: Type[]): Type {
		return types.reduce((a, b) => a.union(b));
	};


	/**
	 * Whether this type has no values assignable to it,
	 * i.e., it is equal to the type `never`.
	 * Used internally for special cases of computations.
	 */
	readonly isBottomType: boolean = this.values.size === 0;
	/**
	 * Whether this type has all values assignable to it,
	 * i.e., it is equal to the type `unknown`.
	 * Used internally for special cases of computations.
	 */
	readonly isTopType: boolean = false;

	/**
	 * Construct a new Type object.
	 * @param isMutable Whether this type is `mutable`. Mutable objects may change fields/entries and call mutating methods.
	 * @param values    An enumerated set of values that are assignable to this type.
	 */
	constructor (
		readonly isMutable: boolean,
		readonly values:    ReadonlySet<OBJ.Object> = new Set(),
	) {
	}

	/**
	 * Return whether this type is mutable or has a mutable operand or component.
	 * @return `true` if this type is mutable or has a mutable operand/component
	 */
	get hasMutable(): boolean {
		return this.isMutable;
	}

	/**
	 * Return whether this type “includes” the value, i.e.,
	 * whether the value is assignable to this type.
	 * @param v the value to check
	 * @returns Is `v` assignable to this type?
	 */
	includes(v: OBJ.Object): boolean {
		return xjs.Set.has(this.values, v, languageValuesIdentical);
	}
	/**
	 * Return the type intersection of this type with another.
	 * @param t the other type
	 * @returns the type intersection
	 */
	@Type.intersectDeco
	intersect(t: Type): Type {
		/** 2-2 | `A \| B == B \| A` */
		if (t instanceof TypeUnion) { return t.intersect(this); }

		return new TypeIntersection(this, t);
	}
	/**
	 * Return the type union of this type with another.
	 * @param t the other type
	 * @returns the type union
	 */
	@Type.unionDeco
	union(t: Type): Type {
		/** 2-1 | `A  & B == B  & A` */
		if (t instanceof TypeIntersection) { return t.union(this); }

		return new TypeUnion(this, t);
	}
	/**
	 * Return a new type that includes the values in this type that are not included in the argument type.
	 * @param t the other type
	 * @returns the type difference
	 */
	@Type.subtractDeco
	subtract(t: Type): Type {
		return new TypeDifference(this, t);
	}
	/**
	 * Return whether this type is a structural subtype of the given type.
	 * @param t the type to compare
	 * @returns Is this type a subtype of the argument?
	 */
	@strictEqual
	@Type.subtypeDeco
	isSubtypeOf(t: Type): boolean {
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
	equals(t: Type): boolean {
		return this.isMutable === t.isMutable && this.isSubtypeOf(t) && t.isSubtypeOf(this);
	}
	mutableOf(): Type {
		return this;
	}
	immutableOf(): Type {
		return this;
	}
}



/**
 * An Interface Type is a set of properties that a value must have.
 */
export class TypeInterface extends Type {
	override readonly isBottomType: boolean = [...this.properties.values()].some((value) => value.isBottomType);
	override readonly isTopType: boolean = this.properties.size === 0;

	/**
	 * Construct a new TypeInterface object.
	 * @param properties a map of this type’s members’ names along with their associated types
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		private readonly properties: ReadonlyMap<string, Type>,
		is_mutable: boolean = false,
	) {
		super(is_mutable);
	}

	override get hasMutable(): boolean {
		return super.hasMutable || [...this.properties.values()].some((t) => t.hasMutable);
	}
	override includes(v: OBJ.Object): boolean {
		return [...this.properties.keys()].every((key) => key in v)
	}
	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type intersection is taken.
	 */
	@Type.intersectDeco
	override intersect(t: Type): Type {
		if (t instanceof TypeInterface) {
			const props: Map<string, Type> = new Map([...this.properties]);
			;[...t.properties].forEach(([name, type_]) => {
				props.set(name, (props.has(name)) ? props.get(name)!.intersect(type_) : type_)
			})
			return new TypeInterface(props)
		} else {
			return super.intersect(t);
		};
	}
	/**
	 * The *union* of types `S` and `T` is the *intersection* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type union is taken.
	 */
	@Type.unionDeco
	override union(t: Type): Type {
		if (t instanceof TypeInterface) {
			const props: Map<string, Type> = new Map();
			;[...this.properties].forEach(([name, type_]) => {
				if (t.properties.has(name)) {
					props.set(name, type_.union(t.properties.get(name)!))
				}
			})
			return new TypeInterface(props)
		} else {
			return super.union(t);
		};
	}
	/**
	 * In the general case, `S` is a subtype of `T` if every property of `T` exists in `S`,
	 * and for each of those properties `#prop`, the type of `S#prop` is a subtype of `T#prop`.
	 * In other words, `S` is a subtype of `T` if the set of properties on `T` is a subset of the set of properties on `S`.
	 */
	@strictEqual
	@Type.subtypeDeco
	override isSubtypeOf(t: Type): boolean {
		if (t instanceof TypeInterface) {
			return [...t.properties].every(([name, type_]) =>
				this.properties.has(name) && this.properties.get(name)!.isSubtypeOf(type_)
			)
		} else {
			return super.isSubtypeOf(t);
		};
	}
	override mutableOf(): TypeInterface {
		return new TypeInterface(this.properties, true);
	}
	override immutableOf(): TypeInterface {
		return new TypeInterface(this.properties, false);
	}
}



/**
 * Class for constructing the Bottom Type, the type containing no values.
 * @final
 */
class TypeNever extends Type {
	static readonly INSTANCE: TypeNever = new TypeNever();

	override readonly isBottomType: boolean = true;
	override readonly isTopType: boolean = false;

	private constructor () {
		super(false);
	}

	override toString(): string {
		return 'never';
	}
	override includes(_v: OBJ.Object): boolean {
		return false
	}
	@strictEqual
	override equals(t: Type): boolean {
		return t.isBottomType;
	}
}



/**
 * Class for constructing the `void` type.
 * @final
 */
class TypeVoid extends Type {
	static readonly INSTANCE: TypeVoid = new TypeVoid();

	override readonly isBottomType: boolean = false;
	override readonly isTopType: boolean = false;

	private constructor () {
		super(false);
	}

	override toString(): string {
		return 'void';
	}
	override includes(_v: OBJ.Object): boolean {
		return false;
	}
	@Type.intersectDeco
	override intersect(_t: Type): Type {
		return Type.NEVER;
	}
	@strictEqual
	@Type.subtypeDeco
	override isSubtypeOf(_t: Type): boolean {
		return false;
	}
	@strictEqual
	override equals(t: Type): boolean {
		return t === TypeVoid.INSTANCE || super.equals(t);
	}
}



/**
 * Class for constructing the Top Type, the type containing all values.
 * @final
 */
class TypeUnknown extends Type {
	static readonly INSTANCE: TypeUnknown = new TypeUnknown();

	override readonly isBottomType: boolean = false;
	override readonly isTopType: boolean = true;

	private constructor () {
		super(false);
	}

	override toString(): string {
		return 'unknown';
	}
	override includes(_v: OBJ.Object): boolean {
		return true
	}
	@strictEqual
	override equals(t: Type): boolean {
		return t.isTopType;
	}
}
