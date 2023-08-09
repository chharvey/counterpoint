# Data Types and Values
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
An algorithm with output type None returns a [completion structure](#completionstructure)
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
For example, a sequence of Integers is denoted \`Sequence&lt;Integer&gt;\`.


### Vector
A **Vector** is an ordered list of values where the number of values is fixed.
For example, the notation \`Vector&lt;Integer, Float&gt;\` indicates a sequence of two items,
the first of which is of type \`Integer\` and the second of which is of type \`Float\`.


### Structure
A **Structure** is an unordered list of name–value pairs. The names are unique words and the values may be any type.
A name–value pair of a structure is called a **property**.

#### CompletionStructure
A **CompletionStructure** is a specific subtype of [Structure](#structure) with
a mandatory property \`type\` and an optional property \`value\`.
The value of the \`type\` property must be one of the [enumerated](#enumerated-values) specification values
*normal*, *break*, *continue*, *return*, or *throw*, which are described below.
The value of the \`value\` property must be a [Counterpoint Language Value](#Counterpoint-language-types).

Property  | Description
--------- | -----------
\`type\`  | the kind of completion structure
\`value\` | the Counterpoint Language Value carried with the structure

Completion structures are the default values returned by all specification algorithms,
unless explicitly stated otherwise.

This table summarizes the enumerated values of a completion structure’s \`type\` property.

Type       | Meaning
---------- | -------
*normal*   | TODO
*continue* | TODO
*break*    | TODO
*return*   | TODO
*throw*    | TODO

The term “normal completion” refers to any completion with a \`type\` of *normal*, and
the term “abrupt completion” refers to any completion with a \`type\` other than *normal*.


#### EntryTypeStructure
An **EntryTypeStructure** represents an entry in a static collection type.
It contains the type value and whether the entry is optional.

Property     | Description
------------ | -----------
\`type\`     | the Counterpoint Language Type
\`optional\` | a Boolean, whether the entry is optional


#### SymbolStructure
A **SymbolStructure** encapsulates the compile-time information of a declared symbol in Counterpoint source code.
Symbols are identifiers that refer to Counterpoint Language Values or Counterpoint Language Types.

Symbol structures’ properties are described in the tables below.

##### SymbolStructureType
A **SymbolStructureType** represents a type alias referencing a Counterpoint Language Type.

Property      | Description
------------- | -----------
\`id\`        | the unique identifier of the declared symbol
\`typevalue\` | the assessed type (a Counterpoint Language Type) of this symbol

##### SymbolStructureVar
A **SymbolStructureVar** represents a variable referencing a Counterpoint Language Value.

Property    | Description
----------- | -----------
\`id\`      | the unique identifier of the declared symbol
\`unfixed\` | a Boolean, whether the variable may be reassigned
\`type\`    | the Counterpoint Language Type of the variable
\`value\`   | if \`unfixed\` is `false`: the assessed value (if it can be determined, a Counterpoint Language Value) of this symbol; otherwise: *none*


### Nodes

#### Token
A **Token** is the resulting output of a **tokenization** step in lexical analysis.
Tokens are represented by [lexical grammar](./notation.md#the-lexical-grammar) productions
such as `Identifier :::= [A-Za-z_] [A-Za-z0-9_]*`;

#### ParseNode
A ParseNode is the resulting output of a **reduction** step in syntactic analysis.
ParseNodes are repesented by [syntactic grammar](./notation.md#the-syntactic-grammar) productions
such as `ExpressionUnit ::= IDENTIFIER | "(" Expression ")";`.

#### ASTNode
An ASTNode is the resulting output of a **decoration** step in semantic analysis,
which is described by the [Decoration attribute grammar](./notation.md#decoration).
ASTNodes are represented by [tree node schema grammar](./notation.md#tree-node-schema-grammar) productions
such as `SemanticOperation ::= SemanticExpression+;`.



## Counterpoint Language Types
Counterpoint Language Types characterize Counterpoint Language Values, which are
values directly manipulated by a Counterpoint program.

Counterpoint has the following built-in types.
This list is not exhaustive, as Counterpoint Types may be created in any Counterpoint program.


### Value Types and Reference Types
Value types and reference types correspond to [value objects](./intrinsics.md#value-objects)
and [reference objects](./intrinsics.md#reference-objects) respectively.


### Simple Types
Simple types do not comprise other types.

- [Never](#never)
- [Void](#void)
- [Null](#null)
- [Boolean](#boolean)
- [Integer](#integer)
- [Float](#float)
- [String](#string)
- [Object](#object)
- [Unknown](#unknown)

#### Never
The **Never** type is the Botton Type and it represents the set of no values.
No value is assignable to Never,
and expressions of type Never are accepted everywhere.

Never is a subtype of every type,
and no type (except Never itself) is a subtype of Never.
Never is the the “absorption element” of the [intersection](#intersection) operation
and the “identity element” of the [union](#union) operation.

#### Void
The **Void** type represents the completion of an evaluation but the absence of a value.
It is the return type of a function that may have side-effects but that does not return a value.
It is also partly the type of an optional entry in a collection.

There are no values assignable to Void, but it is different from Never in that
it does not behave like the Bottom Type.
Void is not a subtype of every other type; in fact, the only types of which Void is a subtype
are type unions that include it in their construction.
In general, given a type \`‹T›\`,
the [intersection](#intersection) \`And<‹T›, Void>\` is not necessarily the same as Void, and
the [union](#union) \`Or<‹T›, Void>\` is not necessarily the same as \`‹T›\`.

The Void type is also unlike Null in that no Counterpoint Language Value has type Void.

#### Null
The **Null** type has exactly one value, called `null`.
It represents an object without any semantics.

#### Boolean
The **Boolean** type has two logical values, called `true` and `false`.

#### Number
The **Number** type represents numerical values.
The Number type is partitioned into two disjoint subtypes: Integer and Float.

##### Integer
The **Integer** type represents [mathematical integers](#real-integer-numbers).
The Counterpoint compiler represents Integers as 16-bit signed two’s complement values.

The Integers `0` and `-0` represent the same mathematical value, *0*.
The maximum possible value of an Integer is *32,767* and the minimum value is *&minus;32,768*.

The following table lays out some integers and their encodings.

| Encoding                                       | Value      | Notes
| ---------------------------------------------- | ---------- | ---
| `\b0000_0000 \b0000_0000` &emsp; (`\x00 \x00`) | *0* = *&minus;0*
| `\b0000_0000 \b0000_0001` &emsp; (`\x00 \x01`) | *1*
| `\b0000_0000 \b0000_0010` &emsp; (`\x00 \x02`) | *2*
| `\b0000_0000 \b0000_0011` &emsp; (`\x00 \x03`) | *3*
…
| `\b0111_1111 \b1111_1100` &emsp; (`\x7f \xfc`) | *32,764* &emsp; (*7FFC<sub>16</sub>*)
| `\b0111_1111 \b1111_1101` &emsp; (`\x7f \xfd`) | *32,765* &emsp; (*7FFD<sub>16</sub>*)
| `\b0111_1111 \b1111_1110` &emsp; (`\x7f \xfe`) | *32,766* &emsp; (*7FFE<sub>16</sub>*)
| `\b0111_1111 \b1111_1111` &emsp; (`\x7f \xff`) | *32,767* &emsp; (*7FFF<sub>16</sub>*)               | maximum value, *2<sup>15</sup> &minus; 1*
| `\b1000_0000 \b0000_0000` &emsp; (`\x80 \x00`) | *&minus;32,768* &emsp; (*&minus;8000<sub>16</sub>*) | minimum value, *&minus;2<sup>15</sup>*
| `\b1000_0000 \b0000_0001` &emsp; (`\x80 \x01`) | *&minus;32,767* &emsp; (*&minus;7FFF<sub>16</sub>*)
| `\b1000_0000 \b0000_0010` &emsp; (`\x80 \x02`) | *&minus;32,766* &emsp; (*&minus;7FFE<sub>16</sub>*)
| `\b1000_0000 \b0000_0011` &emsp; (`\x80 \x03`) | *&minus;32,765* &emsp; (*&minus;7FFD<sub>16</sub>*)
…
| `\b1111_1111 \b1111_1100` &emsp; (`\xff \xfc`) | *&minus;4*
| `\b1111_1111 \b1111_1101` &emsp; (`\xff \xfd`) | *&minus;3*
| `\b1111_1111 \b1111_1110` &emsp; (`\xff \xfe`) | *&minus;2*
| `\b1111_1111 \b1111_1111` &emsp; (`\xff \xff`) | *&minus;1*

Note: To encode a mathematical integer *i* in two’s complement:
If *i* is within the interval *[0, 2<sup>15</sup> - 1]*, simply return its representation in base 2.
If *i* is within the interval *[&minus;2<sup>15</sup>, -1]*, return the binary representation of *i + 2<sup>16</sup>*.
Else, *i* cannot be encoded.

When performing arithmetic operations such as addition, subtraction, and multiplication,
computed values that are out of range will overflow as if doing modular arithmetic modulus *2<sup>16</sup>*,
offset towards negative infinity by *2<sup>15</sup>*.
For example, the sum represented by *32,767 + 1* will overflow and produce the value represented by *&minus;32,768*.
The behavior of performing arithmetic operations that are invalid in the integers
(such as dividing by a non-factor, or raising to a negative exponent) are defined in each respective operation.
The result of division is rounded towards zero. Dividing by zero results in an error.

##### Float
The **Float** type represents [mathematical rational numbers](#real-rational-numbers)
whose decimals terminate in base 10.
(That is, numbers that can be expressed as a finite sum of multiples of powers of 10.)
The Float type contains “floating-point numbers”, which are 64-bit format values as specified in the
*IEEE Standard for Binary Floating-Point Arithmetic ([IEEE 754-2019](https://standards.ieee.org/standard/754-2019.html))*.

#### String
The **String** type represents textual data and is stored as an immutable sequence of bytes.
Strings are encoded by the [UTF-8 encoding](./algorithms.md#utf8encoding) algorithm.

Conceptually, strings are treated as immutable lists of [mathematical integers](#real-integer-numbers),
where each integer represents a Unicode code point.
A String’s **count** indicates the number of code points in the String, that is,
the number of characters in its unencoded form.
This is compared to its **length**, which is the number of bytes it stores
encoded in memory (see UTF-8 for details).
String length is limited to a maximum of *65,535* bytes,
but it is not directly observable within any Counterpoint program.

Though `String` objects are treated conceptually as lists, they are considered
[primitive objects](./intrinsics.md#primitive-and-composite-objects) and
[value objects](./intrinsics.md#value-objects).
They are primitives because the “items” of these lists are not directly observable —
accessing an index of a string yields another string — and
they are value objects because the string values themselves are copied when assigned
(though the compiler may make any optimizations necessary).

#### Object
The **Object** type contains all references to Counterpoint Language Values.
All reference types and value types are subtypes of **Object**.
Some specific built-in subtypes of Object are described in the [Intrinsics](./intrinsics.md) chapter.

#### Unknown
The **Unknown** type is the Top Type and it represents the set of all possible values.
Any value or expression is assignable to Unknown,
and expressions of type Unknown are accepted almost nowhere.

Unknown is a supertype of every type,
and no type (except Unknown itself) is a supertype of Unknown.
Unknown is the the “identity element” of the [intersection](#intersection) operation
and the “absorption element” of the [union](#union) operation.


### Compound Types
Compound types are derived from other types.

- [Tuple Types](#tuple-types)
- [Record Types](#record-types)
- [Vect Types](#vect-types)
- [Struct Types](#struct-types)
- [List Types](#list-types)
- [Dict Types](#dict-types)
- [Set Types](#set-types)
- [Map Types](#map-types)

#### Tuple Types
A **Tuple** type describes instances of [`Tuple`](./intrinsics.md#tuple) and is parameterized by
a [Sequence](#sequence) of [EntryTypeStructure](#entrytypestructure) items, called invariants.
The objects that any given Tuple type describes are `Tuple` objects whose
items’ types match up with the invariants in the sequence in order.
Tuples have a static size, are ordered, and are 0-origin indexable by Integers.
The invariants of a Tuple type are restricted to value types.

#### Record Types
A **Record** type describes instances of [`Record`](./intrinsics.md#record) and is parameterized by
a [Structure](#structure) with [EntryTypeStructure](#entrytypestructure) values, called invariants.
The objects that any given Record type describes are `Record` objects whose
properties’ types match up with the invariants in the structure by name.
Records have a static size, are unordered<sup>&lowast;</sup>, and are indexable by keys.
The invariants of a Record type are restricted to value types.

#### Vect Types
A **Vect** type describes instances of [`Vect`](./intrinsics.md#vect) and is parameterized by
a [Sequence](#sequence) of [EntryTypeStructure](#entrytypestructure) items, called invariants.
The objects that any given Vect type describes are `Vect` objects whose
items’ types match up with the invariants in the sequence in order.
Vects have a static size, are ordered, and are 0-origin indexable by Integers.
The invariants of a Vect type are restricted to value types.

#### Struct Types
A **Struct** type describes instances of [`Struct`](./intrinsics.md#struct) and is parameterized by
a [Structure](#structure) with [EntryTypeStructure](#entrytypestructure) values, called invariants.
The objects that any given Struct type describes are `Struct` objects whose
properties’ types match up with the invariants in the structure by name.
Structs have a static size, are unordered<sup>&lowast;</sup>, and are indexable by keys.
The invariants of a Struct type are restricted to value types.

#### List Types
A **List** type describes instances of [`List`](./intrinsics.md#list) and is parameterized by a single type,
called an invariant, representing items.
The objects that any given List type describes are `List` objects whose
items are assignable to the invariant of the List type.
Lists have a dynamic size, are ordered, and are 0-origin indexable by Integers.

#### Dict Types
A **Dict** type describes instances of [`Dict`](./intrinsics.md#dict) and is parameterized by a single type,
called an invariant, representing values.
The objects that any given Dict type describes are `Dict` objects whose
values are assignable to the invariant of the Dict type.
Dicts have a dynamic size, are unordered<sup>&lowast;</sup>, and are indexable by keys.

#### Set Types
A **Set** type describes instances of [`Set`](./intrinsics.md#set) and is parameterized by a single type,
called an invariant, representing elements.
The objects that any given Set type describes are `Set` objects whose
elements are assignable to the invariant of the Set type.
Sets have a dynamic size, are unordered<sup>&lowast;</sup>, and are indexable by their elements.
The value corresponding to a set index is a [Boolean](#boolean) value indicating whether the set contains that element.

#### Map Types
A **Map** type describes instances of [`Map`](./intrinsics.md#map) and is parameterized by a pair of two types,
called invariants, the first of which represents antecedents and the second of which represents consequents.
The objects that any given Map type describes are `Map` objects whose
antcedents and consequents are respectively assignable to the invariants of the Map type.
Maps have a dynamic size, are unordered<sup>&lowast;</sup>, and are indexable by their antecedents.

<sup>&lowast;</sup>Rather, developers should not depend on any implementation of order.



## Type Operations


### IsReference
A function that determines whether a type is a [reference type or a value type](#value-types-and-reference-types).
```
Boolean IsReference(Type t) :=
	1. *If* `t` is a Counterpoint Specification Type:
		1. *Return:* `false`.
	2. *Assert:* `t` is a Counterpoint Language Type.
	3. *Let* `valuetypes` be a new Sequence [
		`Never`,
		`Void`,
		`Null`,
		`Boolean`,
		`Number`,
		`String`,
	].
	4. *Set* `valuetypes` to a reduction of `valuetypes` for each `a` and `b` to *UnwrapAffirm:* `Union(a, b)`.
	5. *If* *UnwrapAffirm:* `Subtype(t, valuetypes)`:
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


### Intersection
A data type specified as \`And<‹T›, ‹U›>\`,
where \`‹T›\` and \`‹U›\` are metavariables representing any data types,
is a data type that contains values assignable to *both* type \`‹T›\` and type \`‹U›\`.
Such a data type is called the **intersection** of \`‹T›\` and \`‹U›\`.

```
Type Intersect(Type a, Type b) :=
	// 1-5 | `T  & never   == never`
	1. *If* *UnwrapAffirm:* `Identical(b, Never)`:
		1. *Return:* `Never`.
	2. *If* *UnwrapAffirm:* `Identical(a, Never)`:
		1. *Return:* `a`.
	// 1-6 | `T  & unknown == T`
	3. *If* *UnwrapAffirm:* `Identical(b, Unknown)`:
		1. *Return:* `a`.
	4. *If* *UnwrapAffirm:* `Identical(a, Unknown)`:
		1. *Return:* `b`.
	// 3-3 | `A <: B  <->  A  & B == A`
	5. *If* *UnwrapAffirm:* `Subtype(a, b)`:
		1. *Return:* `a`.
	6. *If* *UnwrapAffirm:* `Subtype(b, a)`:
		1. *Return:* `b`.
	7. *Return:* a new type with values given by the the intersection of values in `a` and `b`.
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
	// 1-7 | `T \| never   == T`
	1. *If* *UnwrapAffirm:* `Identical(b, Never)`:
		1. *Return:* `a`.
	2. *If* *UnwrapAffirm:* `Identical(a, Never)`:
		1. *Return:* `b`.
	// 1-8 | `T \| unknown == unknown`
	3. *If* *UnwrapAffirm:* `Identical(b, Unknown)`:
		1. *Return:* `b`.
	4. *If* *UnwrapAffirm:* `Identical(a, Unknown)`:
		1. *Return:* `Unknown`.
	// 3-4 | `A <: B  <->  A \| B == B`
	5. *If* *UnwrapAffirm:* `Subtype(a, b)`:
		1. *Return:* `b`.
	6. *If* *UnwrapAffirm:* `Subtype(b, a)`:
		1. *Return:* `a`.
	7. *Return:* a new type with values given by the the union of values in `a` and `b`.
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
	1. *If* *UnwrapAffirm:* `Identical(a, b)`:
		// 2-7 | `A <: A`
		1. *Return:* `true`.
	2. *If* *UnwrapAffirm:* `IsBottomType(a)`:
		// 1-1 | `never <: T`
		1. *Return:* `true`.
	3. *If* *UnwrapAffirm:* `IsBottomType(b)`:
		// 1-3 | `T       <: never  <->  T == never`
		1. *Return:* `IsBottomType(a)`.
	4. *If* *UnwrapAffirm:* `IsTopType(a)`:
		// 1-4 | `unknown <: T      <->  T == unknown`
		1. *Return:* `IsTopType(b)`.
	5. *If* *UnwrapAffirm:* `IsTopType(b)`:
		// 1-2 | `T     <: unknown`
		1. *Return:* `true`.
	6. *If* `a` is the intersection of some types `x` and `y`:
		1. *If* *UnwrapAffirm:* `Equal(x, b)` *or* *UnwrapAffirm:* `Equal(y, b)`:
			// 3-1 | `A  & B <: A  &&  A  & B <: B`
			1. *Return:* `true`.
		2. *If* *UnwrapAffirm:* `Subtype(x, b)` *or* *UnwrapAffirm:* `Subtype(y, b)`:
			// 3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C`
			1. *Return:* `true`.
	7. *If* `b` is the intersection of some types `x` and `y`:
		1. *If* *UnwrapAffirm:* `Subtype(a, x)` *or* *UnwrapAffirm:* `Subtype(a, y)`:
			// 3-5 | `A <: C    &&  A <: D  <->  A <: C  & D`
			1. *Return:* `true`.
	8. *If* `a` is the union of some types `x` and `y`:
		1. *If* *UnwrapAffirm:* `Subtype(x, b)` *or* *UnwrapAffirm:* `Subtype(y, b)`:
			// 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C`
			1. *Return:* `true`.
	9. *If* `b` is the union of some types `x` and `y`:
		1. *If* *UnwrapAffirm:* `Equal(a, x)` *or* *UnwrapAffirm:* `Equal(a, y)`:
			// 3-2 | `A <: A \| B  &&  B <: A \| B`
			1. *Return:* `true`.
		2. *If* *UnwrapAffirm:* `Subtype(a, x)` *or* *UnwrapAffirm:* `Subtype(a, y)`:
			// 3-6 | `A <: C  \|\|  A <: D  -->  A <: C \| D`
			1. *Return:* `true`.
	10. *If* `a` is a Tuple type *and* `b` is a Tuple type:
		1. *Let* `seq_a` be a Sequence whose items are exactly the items in `a`.
		2. *Let* `seq_b` be a Sequence whose items are exactly the items in `b`.
		3. *Let* `seq_a_req` be a filtering of `seq_a` for each `ia` such that `ia.optional` is `false`.
		4. *Let* `seq_b_req` be a filtering of `seq_b` for each `ib` such that `ib.optional` is `false`.
		5. *If* `seq_a_req.count` is less than `seq_b_req.count`:
			1. *Return:* `false`.
		6. *If* `b` is mutable:
			1. *If* `a` is not mutable:
				1. *Return:* `false`.
		7. *For index* `i` in `seq_b`:
			1. *If* `seq_b[i].optional` is `false`:
				1. *Assert:* `seq_a[i]` is set *and* `seq_a[i].optional` is `false`.
			2. *If* `seq_a[i]` is set:
				1. *If* `b` is mutable *and* *UnwrapAffirm:* `Equal(seq_a[i].type, seq_b[i].type)` is `false`:
					1. *Return:* `false`.
				2. *Else If* *UnwrapAffirm:* `Subtype(seq_a[i].type, seq_b[i].type)` is `false`:
					1. *Return:* `false`.
		9. *Return:* `true`.
	11. *If* `a` is a Record type *and* `b` is a Record type:
		1. *Let* `struct_a` be a Structure whose properties are exactly the properties in `a`.
		2. *Let* `struct_b` be a Structure whose properties are exactly the properties in `b`.
		3. *Let* `struct_a_req` be a filtering of `struct_a`’s values for each `va` such that `va.optional` is `false`.
		4. *Let* `struct_b_req` be a filtering of `struct_b`’s values for each `vb` such that `vb.optional` is `false`.
		5. *If* `struct_a_req.count` is less than `struct_b_req.count`:
			1. *Return:* `false`.
		6. *If* `b` is mutable:
			1. *If* `a` is not mutable:
				1. *Return:* `false`.
		9. *For key* `k` in `struct_b`:
			1. *If* `struct_b[k].optional` is `false`:
				1. *If* `struct_a[k]` is not set *or* `struct_a[k].optional` is `true`:
					1. *Return:* `false`.
			2. *If* `struct_a[k]` is set:
				1. *If* `b` is mutable *and* *UnwrapAffirm:* `Equal(struct_a[k].type, struct_b[k].type)` is `false`:
					1. *Return:* `false`.
				2. *Else If* *UnwrapAffirm:* `Subtype(struct_a[k].type, struct_b[k].type)` is `false`:
					1. *Return:* `false`.
		9. *Return:* `true`.
	12. *If* `a` is a List type *and* `b` is a List type:
		1. *Let* `ai` be the union of types in `a`.
		2. *Let* `bi` be the union of types in `b`.
		3. *If* `b` is mutable:
			1. *If* `a` is mutable *and* *UnwrapAffirm:* `Equal(ai, bi)` is `true`:
				1. *Return:* `true`.
		4. *Else:*
			1. *If* *UnwrapAffirm:* `Subtype(ai, bi)` is `true`:
				1. *Return:* `true`.
	13. *If* `a` is a Dict type *and* `b` is a Dict type:
		1. *Let* `av` be the union of value types in `a`.
		2. *Let* `bv` be the union of value types in `b`.
		3. *If* `b` is mutable:
			1. *If* `a` is mutable *and* *UnwrapAffirm:* `Equal(av, bv)` is `true`:
				1. *Return:* `true`.
		4. *Else:*
			1. *If* *UnwrapAffirm:* `Subtype(av, bv)` is `true`:
				1. *Return:* `true`.
	14. *If* `a` is a Set type *and* `b` is a Set type:
		1. *Let* `ae` be the union of types in `a`.
		2. *Let* `be` be the union of types in `b`.
		3. *If* `b` is mutable:
			1. *If* `a` is mutable *and* *UnwrapAffirm:* `Equal(ae, be)` is `true`:
				1. *Return:* `true`.
		4. *Else:*
			1. *If* *UnwrapAffirm:* `Subtype(ae, be)` is `true`:
				1. *Return:* `true`.
	15. *If* `a` is a Map type *and* `b` is a Map type:
		1. *Let* `ak` be the union of antecedent types in `a`.
		2. *Let* `av` be the union of consequent types in `a`.
		3. *Let* `bk` be the union of antecedent types in `b`.
		4. *Let* `bv` be the union of consequent types in `b`.
		5. *If* `b` is mutable:
			1. *If* `a` is mutable *and* *UnwrapAffirm:* `Equal(ak, bk)` is `true` *and* *UnwrapAffirm:* `Equal(av, bv)` is `true`:
					1. *Return:* `true`.
		6. *Else:*
			1. *If* *UnwrapAffirm:* `Subtype(ak, bk)` is `true` *and* *UnwrapAffirm:* `Subtype(av, bv)` is `true`:
				1. *Return:* `true`.
	16. *If* every value that is assignable to `a` is also assignable to `b`:
		1. *Note:* This covers all subtypes of `Object`, e.g., `Subtype(Integer, Object)` returns true
			because an instance of `Integer` is an instance of `Object`.
		2. *Return:* `true`.
	17. *Return:* `false`.
;
```


### Equality
A type \`‹T›\` is **equal** to type \`‹U›\` iff \`‹T›\` is a subtype of \`‹U›\` and \`‹U›\` is a subtype of \`‹T›\`.


### Disjoint
A type \`‹T›\` is **disjoint** with type \`‹U›\` iff \`‹T›\` and \`‹U›\` have no values in common.
That is, their intersection is empty, or equal to the [Bottom Type](#never).



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
1-1 | `never <: T`              | Bottom is a subtype   of any type.
1-2 | `T     <: unknown`        | Top    is a supertype of any type.
1-3 | `T       <: never  <->  T == never`   | Any subtype   of Bottom is Bottom (follows from 3-3, 1-5, 2-7)
1-4 | `unknown <: T      <->  T == unknown` | Any supertype of Top    is Top    (follows from 3-4, 1-8, 2-7)
1-5 | `T  & never   == never`   | Bottom is The Absorption Element of Intersection (follows from 1-1 and 3-3)
1-6 | `T  & unknown == T`       | Top    is The Identity   Element of Intersection (follows from 1-2 and 3-3)
1-7 | `T \| never   == T`       | Bottom is The Identity   Element of Union        (follows from 1-1 and 3-4)
1-8 | `T \| unknown == unknown` | Top    is The Absorption Element of Union        (follows from 1-2 and 3-4)


### Operation Properties
\# | Law | Description
-- | --- | -----------
2-1 | `A  & B == B  & A`               | Intersection is Comutative
2-2 | `A \| B == B \| A`               | Union        is Commutative
2-3 | `(A  & B)  & C == A  & (B  & C)` | Intersection is Associative
2-4 | `(A \| B) \| C == A \| (B \| C)` | Union        is Associative
2-5 | `A  & (B \| C) == (A  & B) \| (A  & C)` | Intersection Distributes over Union
2-6 | `A \| (B  & C) == (A \| B)  & (A \| C)` | Union        Distributes over Intersection
2-7 | `A <: A`                          | Subtype is Reflexive
2-8 | `A <: B  &&  B <: A  -->  A == B` | Subtype is Anti-Symmetric
2-9 | `A <: B  &&  B <: C  -->  A <: C` | Subtype is Transitive


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


### Difference Properties
\# | Law | Description
-- | --- | -----------
4-1 | `A - B == A  <->  A & B == never`             | The difference of two types is the first type iff they are disjoint.
4-2 | `A - B == never  <->  A <: B`                 | The difference of two types is empty iff the first type is a subtype of the second type.
4-3 | `A <: B - C  <->  A <: B  &&  A & C == never` | Any subtype of a difference is a subtype of its first part and disjoint with its second part.
4-4 | `(A \| B) - C == (A - C) \| (B - C)` | Difference is Right-Distributive    over Union
4-5 | `A - (B \| C) == (A - B)  & (A - C)` | Difference is Left-Antidistributive over Union
