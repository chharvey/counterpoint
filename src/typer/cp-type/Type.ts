import * as xjs from 'extrajs';
import {strictEqual} from '../../lib/index.js';
import {languageValuesIdentical} from '../utils-private.js';
import * as OBJ from '../cp-object/index.js';
import {
	TypeIntersection,
	TypeUnion,
	TypeDifference,
	VOID,
	NULL,
} from './index.js';
import {
	memoizeIntersection,
	memoizeUnion,
	memoizeSubtype,
	operatorDeco,
	intersectDeco,
	unionDeco,
	subtractDeco,
	subtypeDeco,
} from './decorators.js';



/**
 * Parent class for all Counterpoint Language Types.
 * Known subclasses:
 * - Combinable
 * - TypeDifference
 * - ValueType
 * - TypeInterface
 * - TypeUnknown
 * - TypeObject
 * - TypeList
 * - TypeDict
 * - TypeSet
 * - TypeMap
 */
export abstract class Type {
	static get #falsyTypes(): readonly Type[] {
		return [VOID, NULL, OBJ.Boolean.FALSETYPE];
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
	// eslint-disable-next-line @typescript-eslint/class-literal-property-style --- overridden in subclasses by getters
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
	 * Is this type definitely a ”falsy” type?
	 * @return  whether this is a subtype of `void | null | false`
	 * @final
	 */
	public isDefinitelyFalsy(): boolean {
		return this.isSubtypeOf(TypeUnion.all(Type.#falsyTypes));
	}

	/**
	 * Is this type definitely a “truthy” type?
	 * @return  `false` if this is the Bottom Type or is a supertype of any of `void` or `null` or `false`; otherwise `true`
	 * @final
	 */
	public isDefinitelyTruthy(): boolean {
		return !this.isBottomType && Type.#falsyTypes.every((t) => !t.isSubtypeOf(this));
	}

	/**
	 * Returns the “falsy side” of this type.
	 * @return this type’s intersection with all falsy types
	 * @final
	 */
	public falsySide(): Type {
		return this.intersect(TypeUnion.all(Type.#falsyTypes));
	}

	/**
	 * Returns the “truthy side” of this type.
	 * @return this type, minus all falsy types
	 * @final
	 */
	public truthySide(): Type {
		return this.subtract(TypeUnion.all(Type.#falsyTypes));
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
	@memoizeIntersection
	@operatorDeco
	@intersectDeco
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
	@memoizeUnion
	@operatorDeco
	@unionDeco
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
	@operatorDeco
	@subtractDeco
	public subtract(t: Type): Type {
		return new TypeDifference(this, t);
	}

	/**
	 * Return whether this type is a structural subtype of the given type.
	 * @param t the type to compare
	 * @returns Is this type a subtype of the argument?
	 */
	@strictEqual
	@memoizeSubtype
	@subtypeDeco
	public isSubtypeOf(t: Type): boolean {
		return !this.isBottomType && !!this.values.size && // these checks are needed in cases of `Object` and `void`, which don’t store values
			[...this.values].every((v) => t.includes(v));
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
	@operatorDeco
	@intersectDeco
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
	@memoizeUnion
	@operatorDeco
	@unionDeco
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
	@memoizeSubtype
	@subtypeDeco
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
