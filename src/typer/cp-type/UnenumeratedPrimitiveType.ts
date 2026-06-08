import {ValueType} from './ValueType.ts';



/**
 * An unenumerated primitive type is a primitive type with countless values.
 * It may be truly infinite, e.g. in the case of `str`, or it may just contain an extremely large quantity of values, e.g. `float`.
 * In either case, this superclass exists to make it easier to implement the rules for subtyping.
 *
 * Since the compiler only selects a few canonical values to do basic subtype checking,
 * we end up with situations where some subtype checks are incorrect.
 *
 * For example, type `int` is considered a subtype of type `0 | 1`. This is obviously a mistake.
 * Because it’s impractical to list out every possible value of `int`,
 * the compiler only uses two canonical values: `0` and `1`.
 * The consequence of this is that `int` is now internally represented as a type with only two values.
 * Because the subtype algorithm checks for value inclusion, it thinks `int` is equivalent to the union `0 | 1`.
 *
 * Likewise, type `str` only contains one canonical value: the empty string;
 * the compiler considers `str` to be a type containing just `""`, despite it actually being an infinite type (in theory, at least).
 *
 * To fix the problem, we need to override the inherited {@link Type#isSubtypeOf} method, which checks for value inclusion.
 * This class just returns `false` in the method body, falling back on the rules of type theory
 * to carry out the computation (see the {@link subtypeLaws} decorator).
 *
 * This class should only be extended by primitive types for which it is too impractical (or impossible) to list out every value.
 *
 * Known subclasses:
 * - TypeSymbol
 * - Integer
 * - Natural
 * - Float
 * - TypeString
 *
 * @deprecated TODO: delete this class
 */
export abstract class UnenumeratedPrimitiveType extends ValueType {
}
