# Intrinsics
This chapter describes the objects built in to the standard “core” Counterpoint library.



## Primitive and Composite Objects
Primitive objects are unbreakable and are instances of `Null`, `Boolean`, `Integer`, `Float`, or `String`.
These types are discussed in the [Data Types](./data-types.md#simple-types) chapter.

Composite objects are not primitive objects and are composed of other objects (of any kind).

Countable objects are composite objects that allow iteration over their component parts.
They have a **count**, static or dynamic, which is the number of objects they contain.
The maximum count of any countable object is the maximum Integer value, *32,767*.
This is likely to change in future versions of Counterpoint:
if unsigned integers are supported, the maximum count would be increased to *65,535*.



## Value Objects and Reference Objects
Value objects are described completely by their value and have no identity;
they are [identical](./algorithms.md#identical) if and only if they have the “same value”.
Primitive objects are value objects because two primitive objects that have the same value are one in the same.
When a value object is assigned to a variable or parameter, a copy of its value is assigned.
All value objects are immutable.

Reference objects have an identity and are identifiable by reference;
they are [identical](./algorithms.md#identical) if and only if they have the same reference.
Reference objects that have the “same value” are not necessarily identical.
When a reference object is assigned to a variable or parameter, a new reference to the object is assigned,
and any change to the object is observable in every reference.



## `Object`
`Object` is the top class from which all other classes derive.
All objects, primitive and composite, are instances of `Object`.
The Object type is discussed in the [Data Types](./data-types.md#object) chapter.
Most instances of `Object` are reference objects, unless otherwise specified.



## `Null`
There is only one `Null` object: `null`.
`null` is a value object.



## `Boolean`
`Boolean` objects are the binary logical values `true` and `false`.
`Boolean` objects are value objects.



## `Integer`
`Integer` objects are integer numbers with 16-bit encodings.
`Integer` objects are value objects.



## `Float`
`Float` objects are rational numbers encoded in IEEE 754-2019 format.
`Float` objects are value objects.



## `String`
`String` objects are textual data encoded as sequences of bytes (in UTF-8 format).
`String` objects are value objects.



## `Tuple`
`Tuple` objects are fixed-size ordered lists of indexed values, with indices starting at *0*.
The values in Tuples are Counterpoint Language Values.



## `Record`
`Record` objects are fixed-size unordered lists of keyed values, with identifier keys.
The values in Records are Counterpoint Language Values.



## `Vect`
`Vect` objects are fixed-size ordered lists of indexed values, with indices starting at *0*.
The values in Vects are Counterpoint Language Values and are restricted to value objects.
`Vect` objects are value objects.



## `Struct`
`Struct` objects are fixed-size unordered lists of keyed values, with identifier keys.
The values in Structs are Counterpoint Language Values and are restricted to value objects.
`Struct` objects are value objects.



## `List`
`List` objects are variable-size ordered lists of indexed values, with indices starting at *0*.
The values in Lists are Counterpoint Language Values.



## `Dict`
`Dict` objects are variable-size unordered lists of keyed values, with identifier keys.
The values in Dicts are Counterpoint Language Values.



## `Set`
`Set` objects are variable-size unordered lists of values.
The values in Sets are Counterpoint Language Values.



## `Map`
`Map` objects are variable-size unordered associations of values.
The values in Maps are Counterpoint Language Values.
