# Types and Values
This chapter defines the types of data used by grammars and algorithms throughout this specification.

Grammars and algorithms manipulate values, each of which has an associated type.
Types can be thought of as sets of values.
Types are further subclassified into
[Counterpoint Specification Types](#counterpoint-specification-types) and
[Counterpoint Language Types](#counterpoint-language-types).



## Counterpoint Specification Types
Counterpoint Specification Types are only used internally within this specification to define and convey abstract concepts.
They are not directly observable from Counterpoint code.


### None
The **None** type has one value called *none*.
It signifies a variable with no meaningful value.
An algorithm with output type None returns a [CompletionSchema](#completionschema)
with no \`value\` property.


### Enumerated Words
Some sections in this specification may define a set of enumerated words used for a specific purpose.
The enumerated words along with any associated meanings are defined together within the relevant section.
These words are considered Counterpoint Specification Values, but with no defined type;
for intents and purposes they can be thought of as strings.
Where a type description is required (such as in the input of an algorithm), the type «Text» may be used.

For example, a section of this specification may define the enumerated set of arithmetic operands
*ADD*, *SUB*, *MUL*, *DIV*, and *EXP*.
The words might or might not have associated descriptions defined with them.


### RealNumber
The **RealNumber** type represents arbitrary real numbers used in specific situations.
Real numbers cannot be represented accurately in a computer program,
but are used in this specification to perform mathematically accurate computations.

Real numbers are subclassified into the following kinds. The kinds are not necessarily disjoint.

#### Real Integer Numbers
Real integer numbers are the whole numbers *1, 2, 3, …*, their negatives, and *0*.
The term “real integer number” is used to distinguish from [Counterpoint Language Type Integers](#integer).
The real integer numbers refer to the well-understood set of integers in mathematics.
There is no least or greatest real integer number.

#### Real Rational Numbers
Real rational numbers are ratios of integers.
The term “real rational number” is used to distinguish from [Counterpoint Language Type Floats](#float).
The real rational numbers refer to the well-understood set of rationals in mathematics.

Real rational numbers may be represented as fractions (*a/b* means the integer *a* divided by the integer *b*),
as decimals in base ten (*0.123* means *123/1000*),
or in scientific-like notation *p &times; 10<sup>n</sup>* where *p* is a decimal and *n* is an integer.
(We say “scientific-like notation” because there is no requirement that *p* be between *1* and *10*.)

Real rational numbers represent perfect fractions, e.g., *1/3* is exactly one-third and not an approximation.
Real rational numbers may be arbirarily small, i.e., as close to *0* as needed.
The denominator of a fraction can never be *0*.
A real rational number is also a [real integer number](#real-integer-numbers) if its denominator is *1*,
or if it can be reduced to a real rational number whose denominator is *1*.

#### Real Irrational Numbers
Real irrational numbers are not used within this specification, but are mentioned here for completion.
Irrational numbers are numbers that do not equal a ratio of integers.
Such numbers include the following:

- the positive square root of *2*, approximately *1.414214*
- the logarithm base *10* of *2*, approximately *0.301030*
- *tau*, the ratio of a circle’s circumference to its radius, approximately *6.283185*
- *e*, Euler’s number, approximately *2.718282*

#### Mathematical Operators
Algorithms in this specification may perform basic mathematical operations of RealNumber values, which include
addition \`+\`, subtraction \`-\`, multiplication \`*\`, division \`/\`, and exponentiation \`^\`.
These operations are implied with their typical meaning in the context of real numbers.


### Sequence
A **Sequence** is an ordered list of values. The values may be a mix of any type.
If the values fall within a certain type \`‹T›\` (a metavariable),
the Sequence type is denoted \`Sequence<‹T›>\`.
For example, a Sequence of Integers is denoted \`Sequence&lt;Integer&gt;\`.


### Vector
A **Vector** is an ordered list of values where the number of values is fixed.
For example, the notation \`Vector&lt;Integer, Float&gt;\` indicates a list of two items,
the first of which is of type \`Integer\` and the second of which is of type \`Float\`.


### Schema
A **Schema** is an unordered list of name–value pairs. The names are unique words and the values may be any type.
A name–value pair of a Schema is called a **property**.

#### CompletionSchema
A **CompletionSchema** is a specific subtype of [Schema](#schema) with
a mandatory property \`type\` and an optional property \`value\`.
The value of the \`type\` property must be one of the [enumerated](#enumerated-words) specification values
*normal*, *break*, *skip*, *return*, or *throw*, which are described below.
The value of the \`value\` property must be
a [Counterpoint Specification Value](#counterpoint-specification-types) or
a [Counterpoint Language Value](#counterpoint-language-types).

Property  | Description
--------- | -----------
\`kind\`  | the kind of completion
\`value\` | the Counterpoint Specification/Language Value carried with the completion

CompletionSchemas are the default values returned by all specification algorithms,
unless explicitly stated otherwise.

This table summarizes the enumerated values of a CompletionSchema’s \`type\` property.

Type     | Meaning
-------- | -------
*normal* | TODO
*break*  | TODO
*skip*   | TODO
*return* | TODO
*throw*  | TODO

The term “normal completion” refers to any CompletionSchema with a \`kind\` of *normal*, and
the term “abrupt completion” refers to any CompletionSchema with a \`kind\` other than *normal*.


#### EntryTypeSchema
An **EntryTypeSchema** represents an entry in a static collection type.
It contains the type value and whether the entry is optional.

Property     | Description
------------ | -----------
\`type\`     | the Counterpoint Language Type
\`optional\` | a Boolean, whether the entry is optional


#### SymbolSchema
A **SymbolSchema** encapsulates the compile-time information of a declared symbol in Counterpoint source code.
Symbols are identifiers that refer to Counterpoint Language Values or Counterpoint Language Types.

Symbol structures’ properties are described in the tables below.

##### SymbolSchemaType
A **SymbolSchemaType** represents a type alias referencing a Counterpoint Language Type.

Property      | Read-Only? | Description
------------- | ---------- | -----------
\`id\`        | yes        | the unique identifier of the declared symbol
\`typevalue\` | no         | the assessed type (a Counterpoint Language Type) of this symbol

##### SymbolSchemaVar
A **SymbolSchemaVar** represents a variable referencing a Counterpoint Language Value.

Property            | Read-Only? | Description
------------------- | ---------- | -----------
\`id\`              | yes        | the unique identifier of the declared symbol
\`isWritable\`      | yes        | a Boolean, whether the variable may be reassigned
\`isUninitialized\` | yes        | a Boolean, whether the variable was declared without an initial value
\`type\`            | no         | the Counterpoint Language Type of the variable


### Nodes

#### Token
A **Token** is the resulting output of a **tokenization** step in lexical analysis.
Tokens are represented by [lexical grammar](./notation.md#the-lexical-grammar) productions
such as `Identifier :::= [A-Za-z_] [A-Za-z0-9_]*`;

#### ParseNode
A ParseNode is the resulting output of a **reduction** step in syntactic analysis.
ParseNodes are repesented by [syntactic grammar](./notation.md#the-syntactic-grammar) productions
such as `ExpressionUnit ::= IDENTIFIER | "(" Expression ")";`.

#### AstNode
An AstNode is the resulting output of a **decoration** step in semantic analysis,
which is described by the [Decoration attribute grammar](./notation.md#decoration).
AstNodes are represented by [tree node schema grammar](./notation.md#tree-node-schema-grammar) productions
such as `SemanticExpressionOperation ::= SemanticExpression+;`.



## Counterpoint Language Types
Counterpoint Language Types characterize Counterpoint Language Values, which are
values directly manipulated by a Counterpoint program.

Counterpoint has the following built-in types.
This list is not exhaustive, as Counterpoint Types may be created in any Counterpoint program.


### Value Types and Reference Types
Value types and reference types correspond to [data values](./intrinsics.md#data-values)
and [reference objects](./intrinsics.md#reference-objects) respectively.


### Simple Types
Simple types do not comprise other types.

- [Nothing](#nothing)
- [Anything](#anything)
- [Null](#null)
- [Boolean](#boolean)
- [Symbol](#symbol)
- [Integer](#integer)
- [Natural](#natural)
- [Float](#float)
- [String](#string)
- [Object](#object)

#### Nothing
The **Nothing** type is the Botton Type and it represents the set of no values.
No value is assignable to Nothing,
and expressions of type Nothing are accepted everywhere.

Nothing is a subtype of every type,
and no type (except Nothing itself) is a subtype of Nothing.
Nothing is the the “absorption element” of the [intersection](#intersection) operation
and the “identity element” of the [union](#union) operation.

#### Anything
The **Anything** type is the Top Type and it represents the set of all possible values.
Any value or expression is assignable to Anything,
and expressions of type Anything are accepted almost nowhere.

Anything is a supertype of every type,
and no type (except Anything itself) is a supertype of Anything.
Anything is the the “identity element” of the [intersection](#intersection) operation
and the “absorption element” of the [union](#union) operation.

#### Null
The **Null** type has exactly one value, called `null`,
the only instance of [`Null`](./intrinsics.md#null).
It represents an object without any semantics.

#### Boolean
The **Boolean** type has two logical values, called `true` and `false`,
the only instances of [`Boolean`](./intrinsics.md#boolean).

#### Symbol
The **Symbol** type contains instances of [`Symbol`](./intrinsics.md#symbol).
The meaning of each Symbol value may be specified by the programmer.

#### Number
The **Number** type represents numerical values.
The Number type is partitioned into disjoint subtypes, described in the subsections below.

##### Integer
The **Integer** type represents [mathematical integers](#real-integer-numbers).
The Counterpoint compiler represents Integers as 64-bit signed two’s complement values.
They are instances of [`Integer`](./intrinsics.md#integer).

The Integers `0` and `-0` represent the same mathematical value, *0*.
The maximum possible value of an Integer is *9,223,372,036,854,775,807* and the minimum value is *&minus;9,223,372,036,854,775,808*.

The following table lays out some integers and their encodings.

| Encoding (written in hexadecimal)  | Value  | Notes
| ---------------------------------- | ------ | -----
| `\x00_00_00_00_00_00_00_00`        | *0* = *&minus;0*
| `\x00_00_00_00_00_00_00_01`        | *1*
| `\x00_00_00_00_00_00_00_02`        | *2*
| `\x00_00_00_00_00_00_00_03`        | *3*
| …
| `\x7f_ff_ff_ff_ff_ff_ff_fc`        | *9,223,372,036,854,775,804* &emsp; (*7FFF,FFFF,FFFF,FFFC<sub>16</sub>*)
| `\x7f_ff_ff_ff_ff_ff_ff_fd`        | *9,223,372,036,854,775,805* &emsp; (*7FFF,FFFF,FFFF,FFFD<sub>16</sub>*)
| `\x7f_ff_ff_ff_ff_ff_ff_fe`        | *9,223,372,036,854,775,806* &emsp; (*7FFF,FFFF,FFFF,FFFE<sub>16</sub>*)
| `\x7f_ff_ff_ff_ff_ff_ff_ff`        | *9,223,372,036,854,775,807* &emsp; (*7FFF,FFFF,FFFF,FFFF<sub>16</sub>*)               | maximum value, *2<sup>63</sup> &minus; 1*
| `\x80_00_00_00_00_00_00_00`        | *&minus;9,223,372,036,854,775,808* &emsp; (*&minus;8000,0000,0000,0000<sub>16</sub>*) | minimum value, *&minus;2<sup>63</sup>*
| `\x80_00_00_00_00_00_00_01`        | *&minus;9,223,372,036,854,775,807* &emsp; (*&minus;7FFF,FFFF,FFFF,FFFF<sub>16</sub>*)
| `\x80_00_00_00_00_00_00_02`        | *&minus;9,223,372,036,854,775,806* &emsp; (*&minus;7FFF,FFFF,FFFF,FFFE<sub>16</sub>*)
| `\x80_00_00_00_00_00_00_03`        | *&minus;9,223,372,036,854,775,805* &emsp; (*&minus;7FFF,FFFF,FFFF,FFFD<sub>16</sub>*)
| …
| `\xff_ff_ff_ff_ff_ff_ff_fc`        | *&minus;4*
| `\xff_ff_ff_ff_ff_ff_ff_fd`        | *&minus;3*
| `\xff_ff_ff_ff_ff_ff_ff_fe`        | *&minus;2*
| `\xff_ff_ff_ff_ff_ff_ff_ff`        | *&minus;1*

Note: To encode a mathematical integer *i* in two’s complement:
If *i* is within the interval *[0, 2<sup>63</sup> &minus; 1]*, simply return its representation in base 2.
If *i* is within the interval *[&minus;2<sup>63</sup>, &minus;1]*, return the binary representation of *i + 2<sup>64</sup>*.
Else, *i* cannot be encoded.

When performing arithmetic operations such as addition, subtraction, and multiplication,
computed values that are out of range will overflow as if doing modular arithmetic modulus *2<sup>64</sup>*,
offset towards negative infinity by *2<sup>63</sup>*.
For example, the sum represented by *9,223,372,036,854,775,807 + 1* will overflow and produce the value represented by *&minus;9,223,372,036,854,775,808*.
The behavior of performing arithmetic operations that are invalid in the integers
(such as dividing by a non-factor, or raising to a negative exponent) are defined in each respective operation.
The result of division is rounded towards zero. Dividing by zero results in an error.

##### Natural
The **Natural** type represents [non-negative mathematical integers](#real-integer-numbers), also known as “natural numbers”.
The Counterpoint compiler represents Naturals as 64-bit unsigned binary values.
They are instances of [`Natural`](./intrinsics.md#integer).

The maximum possible value of a Natural is *18,446,744,073,709,551,615* (*FFFF,FFFF,FFFF,FFFF<sub>16</sub>* = *2<sup>64</sup> &minus; 1*)
and the minimum value is *0*.

When performing arithmetic operations such as addition and multiplication,
computed values that are out of range will overflow as if doing modular arithmetic modulus *2<sup>64</sup>*.
For example, the sum represented by *18,446,744,073,709,551,615 + 1* will overflow and produce the value *0*.
The behavior of performing arithmetic operations that are invalid in the naturals
(such as subtracting a larger number, dividing by a non-factor, or raising to a negative exponent) are defined in each respective operation.
The result of division is rounded towards zero. Dividing by zero results in an error.
The result of subtracting a larger number from a smaller number is zero; no underflow occurs.

##### Float
The **Float** type represents [mathematical rational numbers](#real-rational-numbers)
whose decimals terminate in base 10.
(That is, numbers that can be expressed as a finite sum of multiples of powers of 10.)
The Float type contains “floating-point numbers”, which are 64-bit format values as specified in the
*IEEE Standard for Binary Floating-Point Arithmetic ([IEEE 754-2019](https://standards.ieee.org/standard/754-2019.html))*.
They are instances of [`Float`](./intrinsics.md#float).

#### String
The **String** type represents textual data and is stored as an immutable sequence of bytes.
Strings are encoded by the [UTF-8 encoding](./algorithms.md#utf8encoding) algorithm.
They are instances of [`String`](./intrinsics.md#string).

Conceptually, strings are thought of immutable lists of [mathematical integers](#real-integer-numbers),
where each integer represents a Unicode code point.
A String’s **count** indicates the number of code points in the String, that is,
the number of characters in its unencoded form.
This is compared to its **length**, which is the number of bytes it stores
encoded in memory (see UTF-8 for details).
String length is limited to a maximum of *65,535* bytes,
but it is not directly observable within any Counterpoint program.

Semantically, the String type is considered to be a [primitive type](./intrinsics.md#primitive-and-composite-values)
because it cannot be decomposed into other types —
the characters of a string value are themselves string values.
As primitive values, strings are also [data values](./intrinsics.md#data-values),
abiding by value-identity and pass-by-value semantics.

That said, strings are implemented as arrays of bytes in the virtual machine,
which makes them composite values under the hood.

#### Object
The **Object** type contains all references to Counterpoint Language Values.
All reference types are subtypes of **Object**,
and all reference objects are instances of [`Object`](./intrinsics.md#object).
Some specific built-in subtypes of **Object** are described in the [Intrinsics](./intrinsics.md) chapter.


### Compound Types
Compound types are derived from other types.

- [Tuple Types](#tuple-types)
- [Record Types](#record-types)
- [List Types](#list-types)
- [Dict Types](#dict-types)
- [Set Types](#set-types)
- [Map Types](#map-types)

#### Tuple Types
A **Tuple** type describes instances of [`Tuple`](./intrinsics.md#tuple) and is parameterized by
a [Sequence](#sequence) of [EntryTypeSchema](#entrytypeschema) items, called *type arguments*.
The objects that any given Tuple type describes are `Tuple` objects whose
items’ types match up with the type arguments in the Sequence in order.
Tuples have a static size, are ordered, and are 0-origin indexable by real integer numbers.

#### Record Types
A **Record** type describes instances of [`Record`](./intrinsics.md#record) and is parameterized by
a [Schema](#schema) with [EntryTypeSchema](#entrytypeschema) values, called *type arguments*.
The objects that any given Record type describes are `Record` objects whose
properties’ types match up with the type arguments in the Schema by name.
Records have a static size, are unordered<sup>&lowast;</sup>, and are indexable by keys.

#### List Types
A **List** type describes instances of [`List`](./intrinsics.md#list) and is parameterized by a single type,
called a *type argument*, representing items.
The objects that any given List type describes are `List` objects whose
items are assignable to the type argument of the List type.
Lists have a dynamic size, are ordered, and are 0-origin indexable by real integer numbers.

#### Dict Types
A **Dict** type describes instances of [`Dict`](./intrinsics.md#dict) and is parameterized by a single type,
called a *type argument*, representing values.
The objects that any given Dict type describes are `Dict` objects whose
values are assignable to the type argument of the Dict type.
Dicts have a dynamic size, are unordered<sup>&lowast;</sup>, and are indexable by keys.

#### Set Types
A **Set** type describes instances of [`Set`](./intrinsics.md#set) and is parameterized by a single type,
called a *type argument*, representing elements.
The objects that any given Set type describes are `Set` objects whose
elements are assignable to the type argument of the Set type.
Sets have a dynamic size, are unordered<sup>&lowast;</sup>, and are indexable by their elements.
The value corresponding to a set index is a [Boolean](#boolean) value indicating whether the set contains that element.

#### Map Types
A **Map** type describes instances of [`Map`](./intrinsics.md#map) and is parameterized by a pair of two types,
called *type arguments*, the first of which represents antecedents and the second of which represents consequents.
The objects that any given Map type describes are `Map` objects whose
antcedents and consequents are respectively assignable to the type arguments of the Map type.
Maps have a dynamic size, are unordered<sup>&lowast;</sup>, and are indexable by their antecedents.

<sup>&lowast;</sup>Rather, developers should not depend on any implementation of order.


### Callable Types

- [Function Types](#function-types)

#### Function Types
A **Function** type describes instances of [`Function`](./intrinsics.md#function) and is parameterized by a triple containing
a [Sequence](#sequence) of [EntryTypeSchema](#entrytypeschema) items representing positional function parameters, followed by
a [Schema](#schema) with [EntryTypeSchema](#entrytypeschema) values representing named function parameters, followed optionally by
a type representing a return type.
The objects that any given Function type describes are `Function` objects whose
parameters and return type are respectively assignable to the types parameterizing the Function Type.


### Nominal Types
Nominal types form a type hierarchy where assignability is determined by name alone.

For classes:
- Any value assigned to a nominal class must be instantiated by it (or a subclass thereof).
- Any type assignable to a nominal class must be either a subclass of it,
	or an interface (or sub-interface thereof) that explicitly extends it (or a subclass thereof).
- Any class or interface that extends a nominal class must also be nominal.

For interfaces:
- Any value assigned to a nominal interface must be instantiated by
	a class (or subclass thereof) that explicitly implements it (or a sub-interface thereof).
- Any type assignable to a nominal interface must be either a sub-interface of it,
	or a class (or subclass thereof) that explicitly implements it (or a sub-interface thereof).
- Futher, if a nominal interface *extends some nominal superclass*, then
	any class that explicitly implements it must *also* explicitly extend the superclass.
- Any class that implements a nominal interface must also be nominal.
- Any interface that inherits from a nominal interface must also be nominal.



## Type Operations


### IsReference
A function that determines whether a type is a [reference type or a value type](#value-types-and-reference-types).
```
Boolean IsReference(Type t) :=
	1. *If* `t` is a Counterpoint Specification Type:
		1. *Return:* `false`.
	2. *Assert:* `t` is a Counterpoint Language Type.
	3. *Let* `valuetypes` be a new Sequence [
		`Nothing`,
		`Null`,
		`Boolean`,
		`Number`,
		`String`,
	].
	4. *Set* `valuetypes` to a reduction of `valuetypes` for each `a` and `b` to *UnwrapAffirm:* `Union(a, b)`.
	5. *If* *UnwrapAffirm:* `Subtype(t, valuetypes)` is `true`:
		1. *Return:* `false`.
	6. *If* `t` is a Tuple or Record type:
		1. *Return:* `false`.
	7. *If* `t` is a Union of some types `a` and `b`:
		1. *If* *UnwrapAffirm:* `IsReference(a)` is `true` *or* *UnwrapAffirm:* `IsReference(b)` is `true`:
			1. *Return:* `true`.
		2. *Return:* `false`.
	8. *Return:* `true`.
;
```


### IsBottomType
A type \`‹T›\` is the **bottom type**, named Nothing, iff \`‹T›\` contains no values.


### IsTopType
A type \`‹T›\` is the **top type**, named Anything, iff \`‹T›\` contains all possible values.


### IsDefinitelyFalsy
A type is **definitely falsy** if it is a subtype of any of the falsy types or their union:
Null or the unit type containing exactly the `false` value.

```
Boolean IsDefinitelyFalsy(Type t) :=
	1. *Let* `false_type` be *UnwrapAffirm:* `ToType(false)`.
	2. *Let* `falsy_types` be *UnwrapAffirm:* `Union(Null, false_type)`.
	3. *Return:* `Subtype(t, falsy_types)`.
;
```


### IsDefinitelyTruthy
A type is **definitely truthy** if it is not the bottom type and it is not a supertype of any of the falsy types:
Null or the unit type containing exactly the `false` value.

```
Boolean IsDefinitelyTruthy(Type t) :=
	1. *If* *UnwrapAffirm:* `IsBottomType(t)` is `true`:
		1. *Return:* `false`.
	2. *Let* `false_type` be *UnwrapAffirm:* `ToType(false)`.
	3. *Let* `falsy_types` be a new Sequence [Null, `false_type`].
	4. *For each* `falsy_type` in `falsy_types`:
		1. *If* *UnwrapAffirm:* `Subtype(falsy_type, t)`:
			1. *Return:* `false`.
	5. *Return:* `true`.
;
```


### FalsySide
The **falsy side** of a type is a type comprising all falsy values assignable to the type.
(Falsy values are values \`‹v›\` for which \`ToBoolean(‹v›)\` returns `false`.)

```
Type FalsySide(Type t) :=
	1. *If* *UnwrapAffirm:* `IsDefinitelyFalsy(t)` is `true`:
		1. *Return:* `t`.
	2. *Else If* *UnwrapAffirm:* `IsDefinitelyTruthy(t)` is `true`:
		1. *Return:* `Nothing`.
	3. *Let* `false_type` be *UnwrapAffirm:* `ToType(false)`.
	4. *Let* `falsy_types` be *UnwrapAffirm:* `Union(Null, false_type)`.
	5. *Return:* `Intersection(t, falsy_types)`.
;
```


### TruthySide
The **truthy side** of a type is a type comprising all truthy values assignable to the type.
(Truthy values are values \`‹v›\` for which \`ToBoolean(‹v›)\` returns `true`.)
Equivalently, the **truthy side** of a type comprises all the values in the type excluding falsy values.

```
Type TruthySide(Type t) :=
	1. *If* *UnwrapAffirm:* `IsDefinitelyFalsy(t)` is `true`:
		1. *Return:* `Nothing`.
	2. *Else If* *UnwrapAffirm:* `IsDefinitelyTruthy(t)` is `true`:
		1. *Return:* `t`.
	3. *Let* `false_type` be *UnwrapAffirm:* `ToType(false)`.
	4. *Let* `falsy_types` be *UnwrapAffirm:* `Union(Null, false_type)`.
	5. *Return:* `Difference(t, falsy_types)`.
;
```


### Intersection
A data type specified as \`And<‹T›, ‹U›>\`,
where \`‹T›\` and \`‹U›\` are metavariables representing any data types,
is a data type that contains values assignable to *both* type \`‹T›\` and type \`‹U›\`.
Such a data type is called the **intersection** of \`‹T›\` and \`‹U›\`.

```
Type Intersection(Type a, Type b) :=
	// 1-5 | `T  & nothing  == nothing`
	1. *If* *UnwrapAffirm:* `IsBottomType(a)` is `true` *or* *UnwrapAffirm:* `IsBottomType(b)` is `true`:
		1. *Return:* `Nothing`.
	// 1-6 | `T  & anything == T`
	2. *If* *UnwrapAffirm:* `IsTopType(a)` is `true`:
		1. *Return:* `b`.
	3. *If* *UnwrapAffirm:* `IsTopType(b)` is `true`:
		1. *Return:* `a`.
	// 3-3 | `A <: B  <->  A  & B == A`
	4. *If* *UnwrapAffirm:* `Subtype(a, b)` is `true`:
		1. *Return:* `a`.
	5. *If* *UnwrapAffirm:* `Subtype(b, a)` is `true`:
		1. *Return:* `b`.
	6. *Return:* a new type with values given by the the intersection of values in `a` and `b`.
;
```


### Union
A data type specified as \`Or<‹T›, ‹U›>\`,
where \`‹T›\` and \`‹U›\` are metavariables representing any data types,
is a data type that contains values assignable to *either* type \`‹T›\` or type \`‹U›\` (or both).
Such a data type is called the **union** of \`‹T›\` and \`‹U›\`.

For example, the type \`Or<Integer, Null>\` contains values of either \`Integer\` or \`Null\`.
(Since there is no overlap, there are no values of both \`Integer\` *and* \`Null\`.)

```
Type Union(Type a, Type b) :=
	// 1-7 | `T \| nothing  == T`
	1. *If* *UnwrapAffirm:* `IsBottomType(a)` is `true`:
		1. *Return:* `b`.
	2. *If* *UnwrapAffirm:* `IsBottomType(b)` is `true`:
		1. *Return:* `a`.
	// 1-8 | `T \| anything == anything`
	3. *If* *UnwrapAffirm:* `IsTopType(a)` is `true` *or* *UnwrapAffirm:* `IsTopType(b)` is `true`:
		1. *Return:* `Anything`.
	// 3-4 | `A <: B  <->  A \| B == B`
	4. *If* *UnwrapAffirm:* `Subtype(a, b)` is `true`:
		1. *Return:* `b`.
	5. *If* *UnwrapAffirm:* `Subtype(b, a)` is `true`:
		1. *Return:* `a`.
	6. *Return:* a new type with values given by the the union of values in `a` and `b`.
;
```


### Difference
A data type specified as \`Minus<‹T›, ‹U›>\`,
where \`‹T›\` and \`‹U›\` are metavariables representing any data types,
is a data type that contains values assignable *only* to type \`‹T›\` and *not* to type \`‹U›\`.
Such a data type is called the **difference** of \`‹T›\` and \`‹U›\`.


### Disjunctive Union
A data type specified as \`Xor<‹T›, ‹U›>\`,
where \`‹T›\` and \`‹U›\` are metavariables representing any data types,
is a data type that contains values assignable *either* to type \`‹T›\` *or* to type \`‹U›\`, but not both.
It is formed by taking the difference of the union of \`‹T›\` and \`‹U›\` and the intersection of \`‹T›\` and \`‹U›\`;
that is, by the formula \`Minus< Or<‹T›, ‹U›>, And<‹T›, ‹U›> >\`.
Such a data type is called the **disjunctive union** of \`‹T›\` and \`‹U›\`.

The **symmetric difference** of \`‹T›\` and \`‹U›\`, is formed by taking
the union of the difference of \`‹T›\` and \`‹U›\` and the difference of of \`‹U›\` and \`‹T›\`;
that is, by the formula \`Or< Minus<‹T›, ‹U›>, Minus<‹U›, ‹T›> >\`.
The symmetric difference is equal to to the disjunctive union.


### Subtype
A type \`‹T›\` is a **subtype** of type \`‹U›\` iff every value assignable to \`‹T›\` is also assignable to \`‹U›\`.

```
Boolean Subtype(Type a, Type b) :=
	// 1-1 | `nothing  <: T`
	1. *If* *UnwrapAffirm:* `IsBottomType(a)` is `true`:
		1. *Return:* `true`.
	// 1-3 | `T        <: nothing  <->  T == nothing`
	2. *If* *UnwrapAffirm:* `IsBottomType(b)` is `true`:
		1. *Return:* `IsBottomType(a)`.
	// 1-4 | `anything <: T        <->  T == anything`
	3. *If* *UnwrapAffirm:* `IsTopType(a)` is `true`:
		1. *Return:* `IsTopType(b)`.
	// 1-2 | `T        <: anything`
	4. *If* *UnwrapAffirm:* `IsTopType(b)` is `true`:
		1. *Return:* `true`.
	5. *If* `a` is the intersection of some types `x` and `y`:
		// 3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C`
		1. *If* *UnwrapAffirm:* `Subtype(x, b)` is `true` *or* *UnwrapAffirm:* `Subtype(y, b)` is `true`:
			1. *Return:* `true`.
		// 3-1 | `A  & B <: A  &&  A  & B <: B`
		2. *If* *UnwrapAffirm:* `Equal(x, b)` is `true` *or* *UnwrapAffirm:* `Equal(y, b)` is `true`:
			1. *Return:* `true`.
	6. *If* `b` is the intersection of some types `x` and `y`:
		// 3-5 | `A <: C    &&  A <: D  <->  A <: C  & D`
		1. *If* *UnwrapAffirm:* `Subtype(a, x)` is `true` *and* *UnwrapAffirm:* `Subtype(a, y)` is `true`:
			1. *Return:* `true`.
	7. *If* `a` is the union of some types `x` and `y`:
		// 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C`
		1. *If* *UnwrapAffirm:* `Subtype(x, b)` is `true` *and* *UnwrapAffirm:* `Subtype(y, b)` is `true`:
			1. *Return:* `true`.
	8. *If* `b` is the union of some types `x` and `y`:
		// 3-6 | `A <: C  \|\|  A <: D  -->  A <: C \| D`
		1. *If* *UnwrapAffirm:* `Subtype(a, x)` is `true` *or* *UnwrapAffirm:* `Subtype(a, y)` is `true`:
			1. *Return:* `true`.
		// 3-2 | `A <: A \| B  &&  B <: A \| B`
		2. *If* *UnwrapAffirm:* `Equal(a, x)` is `true` *or* *UnwrapAffirm:* `Equal(a, y)` is `true`:
			1. *Return:* `true`.
	9. *If* `a` is a Tuple type *and* `b` is a Tuple type:
		1. *Let* `seq_a` be a Sequence whose items are exactly the items in `a`.
		2. *Let* `seq_b` be a Sequence whose items are exactly the items in `b`.
		3. *Let* `seq_a_req` be a filtering of `seq_a` for each `ia` such that `ia.optional` is `false`.
		4. *Let* `seq_b_req` be a filtering of `seq_b` for each `ib` such that `ib.optional` is `false`.
		5. *If* `seq_a_req.count` is less than `seq_b_req.count`:
			1. *Return:* `false`.
		6. *For index* `i` in `seq_b`:
			1. *If* `seq_b[i].optional` is `false`:
				1. *Assert:* `seq_a[i]` is set *and* `seq_a[i].optional` is `false`.
			2. *If* `seq_a[i]` is set:
				1. *If* *UnwrapAffirm:* `Subtype(seq_a[i].type, seq_b[i].type)` is `false`:
					1. *Return:* `false`.
		7. *Return:* `true`.
	10. *If* `a` is a Record type *and* `b` is a Record type:
		1. *Let* `sch_a` be a Schema whose properties are exactly the properties in `a`.
		2. *Let* `sch_b` be a Schema whose properties are exactly the properties in `b`.
		3. *Let* `sch_a_req` be a filtering of `sch_a`’s values for each `va` such that `va.optional` is `false`.
		4. *Let* `sch_b_req` be a filtering of `sch_b`’s values for each `vb` such that `vb.optional` is `false`.
		5. *If* `sch_a_req.count` is less than `sch_b_req.count`:
			1. *Return:* `false`.
		6. *For key* `k` in `sch_b`:
			1. *If* `sch_b[k].optional` is `false`:
				1. *If* `sch_a[k]` is not set *or* `sch_a[k].optional` is `true`:
					1. *Return:* `false`.
			2. *If* `sch_a[k]` is set:
				1. *If* *UchAffirm:* `Subtype(sch_a[k].type, sch_b[k].type)` is `false`:
					1. *Return:* `false`.
		7. *Return:* `true`.
	11. *If* `a` is a List type *and* `b` is a List type:
		1. *Let* `ai` be the type argument over `a`.
		2. *Let* `bi` be the type argument over `b`.
		3. *If* `b` is mutable:
			1. *If* `a` is mutable *and* *UnwrapAffirm:* `Equal(ai, bi)` is `true`:
				1. *Return:* `true`.
		4. *Else:*
			1. *If* *UnwrapAffirm:* `Subtype(ai, bi)` is `true`:
				1. *Return:* `true`.
	12. *If* `a` is a Dict type *and* `b` is a Dict type:
		1. *Let* `av` be the type argument over `a`.
		2. *Let* `bv` be the type argument over `b`.
		3. *If* `b` is mutable:
			1. *If* `a` is mutable *and* *UnwrapAffirm:* `Equal(av, bv)` is `true`:
				1. *Return:* `true`.
		4. *Else:*
			1. *If* *UnwrapAffirm:* `Subtype(av, bv)` is `true`:
				1. *Return:* `true`.
	13. *If* `a` is a Set type *and* `b` is a Set type:
		1. *Let* `ae` be the type argument over `a`.
		2. *Let* `be` be the type argument over `b`.
		3. *If* `b` is mutable:
			1. *If* `a` is mutable *and* *UnwrapAffirm:* `Equal(ae, be)` is `true`:
				1. *Return:* `true`.
		4. *Else:*
			1. *If* *UnwrapAffirm:* `Subtype(ae, be)` is `true`:
				1. *Return:* `true`.
	14. *If* `a` is a Map type *and* `b` is a Map type:
		1. *Let* `ak` be the antecedent type argument over `a`.
		2. *Let* `av` be the consequent type argument over `a`.
		3. *Let* `bk` be the antecedent type argument over `b`.
		4. *Let* `bv` be the consequent type argument over `b`.
		5. *If* `b` is mutable:
			1. *If* `a` is mutable *and* *UnwrapAffirm:* `Equal(ak, bk)` is `true` *and* *UnwrapAffirm:* `Equal(av, bv)` is `true`:
					1. *Return:* `true`.
		6. *Else:*
			1. *If* *UnwrapAffirm:* `Subtype(ak, bk)` is `true` *and* *UnwrapAffirm:* `Subtype(av, bv)` is `true`:
				1. *Return:* `true`.
	15. *If* `a` is a Function type *and* `b` is a Function type:
		1. *Let* `app` be the positional parameter type arguments over `a`.
		2. *Let* `apn` be the named parameter type arguments over `a`.
		3. *Let* `ar` be the return type argument over `a`, if it exists.
		4. *Let* `bpp` be the positional parameter type arguments over `b`.
		5. *Let* `bpn` be the named parameter type arguments over `b`.
		6. *Let* `br` be the return type argument over `b`, if it exists.
		7. *Let* `ta` be a new Tuple type containing the items in `app`.
		8. *Let* `tb` be a new Tuple type containing the items in `bpp`.
		9. *If* *UnwrapAffirm:* `Subtype(tb, ta)` is `false`:
			1. *Return:* `false`.
		10. *Else:*
			1. Fall through.
		11. *Let* `ra` be a new Record type containing the properties in `apn`.
		12. *Let* `rb` be a new Record type containing the properties in `bpn`.
		13. *If* *UnwrapAffirm:* `Subtype(rb, ra)` is `false`:
			1. *Return:* `false`.
		14. *Else:*
			1. Fall through.
		15. *If* `ar` is not set *and* `br` is not set:
			1. *Return:* `true`.
		16. *Else:*
			1. Fall through.
		17. *If* `ar` is set *and* `br` is set:
			1. *If* *UnwrapAffirm:* `Subtype(ar, br)` is `true`:
				1. *Return:* `true`.
			2. *Else:*
				1. Fall through.
		18. *Else:*
			1. Fall through.
	16. *If* `IsReference(a)` is `true` *and* `Equal(b, Object)` is `true`:
		1. *Return:* `true`.
	17. *If* every value that is assignable to `a` is also assignable to `b`:
		1. *Return:* `true`.
	18. *Return:* `false`.
;
```


### Equality
A type \`‹T›\` is **equal** to type \`‹U›\` iff \`‹T›\` is a subtype of \`‹U›\` and \`‹U›\` is a subtype of \`‹T›\`.

```
Boolean Equal(Type a, Type b) :=
	1. *If* *UnwrapAffirm:* `Subtype(a, b)` is `true` *and* *UnwrapAffirm:* `Subtype(b, a)` is `true`:
		1. *Return:* `true`.
	2. *Else:*
		1. *Return:* `false`.
;
```


### Disjoint
A type \`‹T›\` is **disjoint** with type \`‹U›\` iff \`‹T›\` and \`‹U›\` have no values in common.
That is, their intersection is empty, or equal to the [Bottom Type](#nothing).

```
Boolean AreDisjoint(Type a, Type b) :=
	1. *Let* `intersection` be *UnwrapAffirm:* `Intersection(a, b)`.
	2. *Return:* `IsBottomType(intersection)`.
;
```



## Value Operations


### ToBoolean
Returns an associated [boolean value](#boolean), with a Counterpoint Language Value.
A synonym for “is truthy”.
```
Boolean ToBoolean(Value value) :=
	1. *If* `value` is an instance of `Null`:
		1. *Return:* `false`.
	2. *If* `value` is an instance of `Boolean`:
		1. *Return:* `value`.
	3. *Return:* `true`.
```


### Identical
Compares two values and returns whether they are the exact same value.
```
Boolean Identical(Value a, Value b) :=
	1. *If* `a` is the value `null` and `b` is the value `null`:
		1. *Return:* `true`.
	2. *If* `a` is the value `false` *and* `b` is the value `false`:
		1. *Return:* `true`.
	3. *If* `a` is the value `true` *and* `b` is the value `true`:
		1. *Return:* `true`.
	4. *If* `a` is an instance of `Integer` *and* `b` is an instance of `Integer`:
		1. *If* `a` and `b` have the same bitwise encoding:
			1. *Return:* `true`.
	5. *If* `a` is an instance of `Natural` *and* `b` is an instance of `Natural`:
		1. *If* `a` and `b` have the same bitwise encoding:
			1. *Return:* `true`.
	6. *If* `a` is an instance of `Float` *and* `b` is an instance of `Float`:
		1. *If* `a` and `b` have the same bitwise encoding:
			1. *Return:* `true`.
	7. *If* `a` is an instance of `String` *and* `b` is an instance of `String`:
		1. *If* `a` and `b` are exactly the same sequence of code units
			(same length and same code units at corresponding indices):
			1. *Return:* `true`.
	8. *If* `a` is an instance of `Tuple` *and* `b` is an instance of `Tuple`:
		1. *Let* `seq_a` be a new Sequence whose items are exactly the items in `a`.
		2. *Let* `seq_b` be a new Sequence whose items are exactly the items in `b`.
		3. *If* `seq_a.count` is not `seq_b.count`:
			1. *Return:* `false`.
		4. Assume *UnwrapAffirm:* `Identical(a, b)` is `true`, and use this assumption when performing the following step.
			1. *Note:* This assumption prevents an infinite loop,
				if `a` and `b` ever recursively contain themselves or each other.
		5. *For index* `i` in `seq_b`:
			1. *If* *UnwrapAffirm:* `Identical(seq_a[i], seq_b[i])` is `false`:
				1. *Return:* `false`.
		6. *Return:* `true`.
	9. *If* `a` is an instance of `Record` *and* `b` is an instance of `Record`:
		1. *Let* `sch_a` be a new Schema whose properties are exactly the properties in `a`.
		2. *Let* `sch_b` be a new Schema whose properties are exactly the properties in `b`.
		3. *If* `sch_a.count` is not `sch_b.count`:
			1. *Return:* `false`.
		4. Assume *UnwrapAffirm:* `Identical(a, b)` is `true`, and use this assumption when performing the following step.
			1. *Note:* This assumption prevents an infinite loop,
				if `a` and `b` ever recursively contain themselves or each other.
		5. *For key* `k` in `sch_b`:
			1. *If* `sch_a[k]` is not set:
				1. *Return:* `false`.
			2. *If* *UnwrapAffirm:* `Identical(sch_a[k], sch_b[k])` is `false`:
				1. *Return:* `false`.
		6. *Return:* `true`.
	10. *If* `a` and `b` are instances of author-defined data classes:
		1. *Let* `a_cons` be the constructor for `a`.
		2. *Let* `b_cons` be the constructor for `b`.
		3. *If* *UnsrapAffirm:* `Identical(a_cons, b_cons)` is `false`:
			1. *Return:* `false`.
		4. *Let* `sch_a` be a new Schema whose properties are exactly the instance properties in `a`.
		5. *Let* `sch_b` be a new Schema whose properties are exactly the instance properties in `b`.
		6. *Perform:* Substeps 9.3 through 9.6 of this algorithm.
	11. *If* `a` and `b` are instances of author-defined reference classes *and* they are the same object:
		1. *Return:* `true`.
	12. *Return:* `false`.
```


### Equal
Compares two values and returns whether they are considered “equal” by some definition.
```
Boolean Equal(Value a, Value b) :=
	1. *If* `Identical(a, b)` is `true`:
		1. *Return:* `true`.
	2. *If* `a` is an instance of `Number` *and* `b` is an instance of `Number`:
		1. *If* `a` is an instance of `Integer` *and* `b` is an instance of `Natural`:
			1. *Return:* `Equal(Natural(a), b)`.
		2. *If* `a` is an instance of `Integer` *and* `b` is an instance of `Float`:
			1. *Return:* `Equal(Float(a), b)`.
		3. *If* `a` is an instance of `Natural` *and* `b` is an instance of `Integer`:
			1. *Return:* `Equal(a, Natural(b))`.
		4. *If* `a` is an instance of `Natural` *and* `b` is an instance of `Float`:
			1. *Return:* `Equal(Float(a), b)`.
		5. *If* `a` is an instance of `Float` *and* `b` is an instance of `Integer`:
			1. *Return:* `Equal(a, Float(b))`.
		6. *If* `a` is an instance of `Float` *and* `b` is an instance of `Natural`:
			1. *Return:* `Equal(a, Float(b))`.
		7. *If* `a` is an instance of `Float` *and* `b` is an instance of `Float`:
			1. *If* `a` is `0.0` *and* `b` is `-0.0`:
				1. *Return:* `true`.
			2. *If* `a` is `-0.0` *and* `b` is `0.0`:
				1. *Return:* `true`.
		8. *Return:* `false`.
	3. Let the substeps of this step be a subroutine for determining equality of given Sequences of items, `seq_a` and `seq_b`.
		1. *Assert:* `seq_a` is a Sequence of Counterpoint language values.
		2. *Assert:* `seq_b` is a Sequence of Counterpoint language values.
		3. *If* `seq_a.count` is not `seq_b.count`:
			1. *Return:* `false`.
		4. *For index* `i` in `seq_b`:
			1. *If* *UnwrapAffirm:* `Equal(seq_a[i], seq_b[i])` is `false`:
				1. *Return:* `false`.
		5. *Return:* `true`.
	4. Let the substeps of this step be a subroutine for determining equality of given Schemata of values, `sch_a` and `sch_b`.
		1. *Assert:* `sch_a` is a Schema of Conterpoint language values.
		2. *Assert:* `sch_b` is a Schema of Conterpoint language values.
		3. *If* `sch_a.count` is not `sch_b.count`:
			1. *Return:* `false`.
		4. *For key* `k` in `sch_b`:
			1. *If* `sch_a[k]` is not set:
				1. *Return:* `false`.
			2. *If* *UnwrapAffirm:* `Equal(sch_a[k], sch_b[k])` is `false`:
				1. *Return:* `false`.
		5. *Return:* `true`.
	5. Assume *UnwrapAffirm:* `Equal(a, b)` is `true`, and use this assumption when performing the following steps.
		1. *Note:* This assumption prevents an infinite loop,
			if `a` and `b` ever recursively contain themselves or each other.
	6. *If* `a` is an instance of `Tuple` *and* `b` is an instance of `Tuple`:
		1. *Let* `seq_a` be a new Sequence whose items are exactly the items in `a`.
		2. *Let* `seq_b` be a new Sequence whose items are exactly the items in `b`.
		3. *Perform:* The subroutine listed in Step 3 of this algorithm.
	7. *If* `a` is an instance of `Record` *and* `b` is an instance of `Record`:
		1. *Let* `sch_a` be a new Schema whose properties are exactly the properties in `a`.
		2. *Let* `sch_b` be a new Schema whose properties are exactly the properties in `b`.
		3. *Perform:* The subroutine listed in Step 4 of this algorithm.
	8. *If* `a` is an instance of `List` *and* `b` is an instance of `List`:
		1. *Let* `seq_a` be a new Sequence whose items are exactly the items in `a`.
		2. *Let* `seq_b` be a new Sequence whose items are exactly the items in `b`.
		3. *Perform:* The subroutine listed in Step 3 of this algorithm.
	9. *If* `a` is an instance of `Dict` *and* `b` is an instance of `Dict`:
		1. *Let* `sch_a` be a new Schema whose properties are exactly the properties in `a`.
		2. *Let* `sch_b` be a new Schema whose properties are exactly the properties in `b`.
		3. *Perform:* The subroutine listed in Step 4 of this algorithm.
	10. *If* `a` is an instance of `Set` *and* `b` is an instance of `Set`:
		1. *Let* `seq_a` be a new Sequence whose items are exactly the items in `a`.
		2. *Let* `seq_b` be a new Sequence whose items are exactly the items in `b`.
		3. *If* `seq_a.count` is not `seq_b.count`:
			1. *Return:* `false`.
		4. *For each* `it_b` in `seq_b`:
			1. Find an item `it_a` in `seq_a` such that *UnwrapAffirm:* `Equal(it_a, it_b)` is `true`.
			2. *If* `it_a` is not set:
				1. *Return:* `false`.
		5. *Return:* `true`.
	11. *If* `a` is an instance of `Map` *and* `b` is an instance of `Map`:
		1. *Let* `data_a` be a new Sequence of 2-tuples,
			whose items are exactly the antecedents and consequents in `a`.
		2. *Let* `data_b` be a new Sequence of 2-tuples,
			whose items are exactly the antecedents and consequents in `b`.
		3. *If* `data_a.count` is not `data_b.count`:
			1. *Return:* `false`.
		4. *For each* `it_b` in `data_b`:
			1. Find an item `it_a` in `data_a` such that *UnwrapAffirm:* `Equal(it_a.0, it_b.0)` is `true`.
			2. *If* `it_a` is not set:
				1. *Return:* `false`.
			3. *If* *UnwrapAffirm:* `Equal(it_a.1, it_b.1)` is `false`:
				1. *Return:* `false`.
		5. *Return:* `true`.
	12. *If* `a` and `b` are instances of author-defined classes (either data classes or reference classes):
		1. *Let* `a_cons` be the constructor for `a`.
		2. *Let* `b_cons` be the constructor for `b`.
		3. *If* *UnsrapAffirm:* `Identical(a_cons, b_cons)` is `false`:
			1. *Note:* Identity of classes (rather than equality) is used here to ensure the arguments have the same type.
			2. *Return:* `false`.
		4. *Let* `sch_a` be a new Schema whose properties are exactly the instance properties in `a`.
		5. *Let* `sch_b` be a new Schema whose properties are exactly the instance properties in `b`.
		6. *Perform:* The subroutine listed in Step 4 of this algorithm.
	13. *Return:* `false`.
```



## Type Laws
The following tables describe laws that hold true for all types in general.

For brevity, this section uses the following notational conventions:
- Metavariables such as \`‹A›\`, \`‹B›\`, \`‹C›\` denote placeholders for Counterpoint Language Types
	and do not refer to real variables or real types.
- Angle quotes and back-ticks will be omitted. Instead, a `monospace font face` is used.
- The [intersection](#intersection)           of `A` and `B`, `And<A, B>`,   is written `A & B`.
- The [difference](#difference)               of `A` and `B`, `Minus<A, B>`, is written `A - B`. The symbol `-`  has the same precedence as `&`.
- The [union](#union)                         of `A` and `B`, `Or<A, B>`,    is written `A | B`. The symbol `|`  is weaker than `&` and `-`.
- The [disjunctive union](#disjunctive-union) of `A` and `B`, `Xor<A, B>`,   is written `A ^ B`. The symbol `^`  has the same precedence as `|`.
- If `A` is a [subtype](#subtype) of `B`, we write `A <: B`.                                     The symbol `<:` is weaker than `|` and `^`.
- If `A` is [equal](#equality)    to `B`, we write `A == B`.                                     The symbol `==` is weaker than `<:`.
- Where ‹X› and ‹Y› represent statements in prose:
	- `‹X› &&  ‹Y›` denotes “‹X› and            ‹Y›”. The symbol `&&`  is weaker than `<:`.
	- `‹X› ||  ‹Y›` denotes “‹X› or             ‹Y›”. The symbol `||`  is weaker than `&&`.
	- `‹X› --> ‹Y›` denotes “‹X› implies        ‹Y›”. The symbol `-->` is weaker than `||`.
	- `‹X› <-> ‹Y›` denotes “‹X› if and only if ‹Y›”. The symbol `<->` is weaker than `-->`.


### Special Elements
\# | Law | Description
-- | --- | -----------
1-1 | `nothing  <: T`        | Bottom is a subtype   of any type.
1-2 | `T        <: anything` | Top    is a supertype of any type.
1-3 | `T        <: nothing  <->  T == nothing`  | Any subtype   of Bottom is Bottom
1-4 | `anything <: T        <->  T == anything` | Any supertype of Top    is Top
1-5 | `T  & nothing  == nothing`  | Bottom is The Absorption Element of Intersection
1-6 | `T  & anything == T`        | Top    is The Identity   Element of Intersection
1-7 | `T \| nothing  == T`        | Bottom is The Identity   Element of Union
1-8 | `T \| anything == anything` | Top    is The Absorption Element of Union


### Operation Properties
\# | Law | Description
-- | --- | -----------
2-1 | `T  & T == T`       | Intersection Idempotence
2-2 | `T \| T == T`       | Union        Idempotence
2-3 | `T  - T == nothing` | Subtracting a type from itself yields Bottom.
2-4 | `A  & B == B  & A`               | Intersection is Comutative
2-5 | `A \| B == B \| A`               | Union        is Commutative
2-6 | `(A  & B)  & C == A  & (B  & C)` | Intersection is Associative
2-7 | `(A \| B) \| C == A \| (B \| C)` | Union        is Associative
2-8 | `A  & (B \| C) == (A  & B) \| (A  & C)` | Intersection Distributes over Union
2-9 | `A \| (B  & C) == (A \| B)  & (A \| C)` | Union        Distributes over Intersection
2-a | `A <: A`                          | Subtype is Reflexive
2-b | `A <: B  &&  B <: A  -->  A == B` | Subtype is Anti-Symmetric
2-c | `A <: B  &&  B <: C  -->  A <: C` | Subtype is Transitive


### Other
\# | Law | Description
-- | --- | -----------
3-1 | `A  & B <: A  &&  A  & B <: B` | Any intersection is a subtype of each of its consituent parts.
3-2 | `A <: A \| B  &&  B <: A \| B` | Each constituent part of any union is a subtype of that union.
3-3 | `A <: B  <->  A  & B == A` | The intersection of a subtype and a supertype is the subtype.
3-4 | `A <: B  <->  A \| B == B` | The union        of a subtype and a supertype is the supertype.
3-5 | `A <: C    &&  A <: D  <->  A <: C  & D` | Subtype is Left-Factorable      under Conjunction, and       Left-Distributive      over Intersection
3-6 | `A <: C  \|\|  A <: D  -->  A <: C \| D` | Subtype is Left-Factorable      under Disjunction (but *not* Left-Distributive      over Union)
3-7 | `A <: C    &&  B <: C  <->  A \| B <: C` | Subtype is Right-Antifactorable under Conjunction, and       Right-Antidistributive over Union
3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C` | Subtype is Right-Antifactorable under Disjunction (but *not* Right-Antidistributive over Intersection)
3-9 | `C <: A --> (A  & B)  & C == B  & C` | Intersecting with a subtype   narrows the intersection.
3-a | `A <: C --> (A \| B) \| C == B \| C` | Unioning     with a supertype widens  the union.


### Difference Properties
\# | Law | Description
-- | --- | -----------
4-1 | `A - B == A  <->  A & B == nothing`             | The difference of two types is the first type iff they are disjoint.
4-2 | `A - B == nothing  <->  A <: B`                 | The difference of two types is empty iff the first type is a subtype of the second type.
4-3 | `A <: B - C  <->  A <: B  &&  A & C == nothing` | Any subtype of a difference is a subtype of its first part and disjoint with its second part.
4-4 | `(A \| B) - C == (A - C) \| (B - C)` | Difference is Right-Distributive    over Union
4-5 | `A - (B \| C) == (A - B)  & (A - C)` | Difference is Left-Antidistributive over Union
