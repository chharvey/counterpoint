# Intrinsics
This chapter describes the objects built in to the standard “core” Solid library.



## Primitive and Composite Objects
Primitive objects are unbreakable and are of type `Null`, `Boolean`, `Integer`, or `Float`.
These types are discussed in the [Data Types](./data-types.md) chapter.

Composite objects are not primitive objects and are composed of other objects (of any kind).

Countable objects are composite objects that store other objects in an internal data structure.
They have a static or dynamic **count**, which is the number of objects it stores.
The maximum count of any countable object is the maximum Integer value, *32,767*.
This is likely to change in future versions of Counterpoint:
if unsigned integers are supported, the maximum count would be increased to *65,535*.



## `Object`
`Object` is the top class from which all other classes derive.
All objects, primitive and composite, are instances of `Object`.



## `String`
`String` objects are textual data encoded as a sequence of bytes (in UTF-8 format).
String length is limited to a maximum of *65,535* bytes,
but it is not directly observable within any Counterpoint program.



## `Tuple`
`Tuple` objects are fixed-size ordered lists of indexed values, with indices starting at `0`.
The values of tuples are Solid Language Values.



## `Record`
`Record` objects are fixed-size unordered lists of keyed values, with identifier keys.
The values of records are Solid Language Values.



## `List`
`List` objects are variable-size ordered lists of indexed values, with indices starting at `0`.
The values of lists are Solid Language Values.



## `Dict`
`Dict` objects are variable-size unordered lists of keyed values, with identifier keys.
The values of dicts are Solid Language Values.



## `Set`
`Set` objects are variable-size unordered lists of values.
The values of sets are Solid Language Values.



## `Map`
`Map` objects are variable-size unordered associations of values.
The antecedents and consequents of maps are Solid Language Values.
