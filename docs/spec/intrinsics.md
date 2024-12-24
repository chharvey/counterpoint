# Intrinsics
This chapter describes the objects built in to the standard “core” Counterpoint library.



## Primitive and Composite Values
Primitive values are unbreakable and are instances of `Null`, `Boolean`, `Integer`, `Float`, or `String`.
These types are discussed in the [Types and Values](./data-types.md#simple-types) chapter.

Composite values are not primitive values and are composed of other values (of any kind).
They include instances of `Tuple`, `Record`, `List`, `Dict`, `Set`, `Map`,
most instances of `Object`, and potentially instances of any programmer-defined classes.

Countable values are composite values that allow iteration over their component parts.
They have a **count**, static or dynamic, which is the number of values they contain.
The maximum count of any countable value is the maximum Integer value, *32,767*.
This is likely to change in future versions of Counterpoint:
if unsigned integers are supported, the maximum count would be increased to *65,535*.



## Data Values
Data values are described completely by their value and have no identity;
they are [identical](./algorithms.md#identical) if and only if they have the “same value”.
All primitive values are data values because two primitive values that have the same value are one in the same.
When a data value is assigned to a variable or parameter, a copy of its value is assigned.
All data values are immutable.
Data values do not all have a common ancestor.


### `Null`
There is only one `Null` object: `null`.


### `Boolean`
`Boolean` objects are the binary logical values `true` and `false`.


### `Integer`
`Integer` objects are integer numbers with 16-bit encodings.


### `Float`
`Float` objects are rational numbers encoded in IEEE 754-2019 format.


### `String`
`String` objects are textual data encoded as sequences of bytes (in UTF-8 format).


### `Tuple`
`Tuple` objects are fixed-size ordered lists of indexed values, with indices starting at *0*.


### `Record`
`Record` objects are fixed-size unordered lists of keyed values, with identifier keys.



## Reference Objects
Reference objects have an identity and are identifiable by reference;
they are [identical](./algorithms.md#identical) if and only if they have the same reference.
Reference objects that have the “same value” are not necessarily identical.
When a reference object is assigned to a variable or parameter, a new reference to the object is assigned,
and any change to the object is observable in every reference.
All reference objects belong to the `Object` class.


### `Object`
The `Object` class contains every reference object.


### `List`
`List` objects are variable-size ordered lists of indexed values, with indices starting at *0*.
The values in Lists are Counterpoint Language Values.


### `Dict`
`Dict` objects are variable-size unordered lists of keyed values, with identifier keys.
The values in Dicts are Counterpoint Language Values.


### `Set`
`Set` objects are variable-size unordered lists of values.
The values in Sets are Counterpoint Language Values.


### `Map`
`Map` objects are variable-size unordered associations of values.
The values in Maps are Counterpoint Language Values.
