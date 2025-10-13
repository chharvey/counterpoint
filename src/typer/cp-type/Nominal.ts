import {Keyword} from '../../parser/index.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {
	subtypeRules,
	Type,
} from './Type.ts';



/**
 * A nominal type is a type that is comparable only by name.
 */
export class Nominal extends Type {
	/**
	 * Construct a new Nominal object.
	 * @param id    The unique identifier of this type.
	 * @param shape The underlying structure (a Type) of this type.
	 */
	public constructor(
		public readonly id:    bigint,
		public readonly shape: Type,
	) {
		super(shape.isMutable, shape.values);
		return new Proxy(this, {
			get(target, key, receiver) {
				// 1. Check if this class directly has it
				if (Object.hasOwn(target, key) || Object.hasOwn(Reflect.getPrototypeOf(target)!, key)) {
					return Reflect.get(target, key, receiver);
				}
				// 2. Fallback to underlying type
				const value = target.shape[key as keyof Type];
				// bind all instance methods to the underlying type
				if (typeof value === 'function' && key !== 'constructor') {
					return value.bind(target.shape);
				}
				return value;
			},
		});
	}


	// declare the missing members to pacify TS
	public declare isReference: boolean;


	public override toString(): string {
		return `${ Keyword.NOMINAL } ${ this.shape.toString() }`;
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeRules
	public override isSubtypeOf(t: Type): boolean {
		return this.shape.isSubtypeOf(t);
	}

	@strictEqual
	@memoizeBinOp(true)
	@instanceOf(() => Nominal)
	public override equals(t: Type): boolean {
		return this.id === (t as Nominal).id;
	}

	/**
	 * Return whether this type has the same definition as the given type.
	 * If the given type is also a nominal type, compares them by shape.
	 *
	 * Note that this is *not* an indicator of type equality.
	 * Two different nominal types may have the same definition,
	 * but should not be considered equal, since they have different names.
	 *
	 * @param t the type to compare structurally
	 * @return  Are the two types defined the same?
	 */
	private sameDfn(t: Type): boolean {
		return this.shape.equals(t instanceof Nominal ? t.shape : t);
	}
}
