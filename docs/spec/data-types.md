# Data Types and Values
This chapter defines the types of data used by grammars and algorithms throughout this specification.

Grammars and algorithms manipulate values, each of which has an associated type.
Types can be thought of as sets of values.
Types are further subclassified into
[Solid Specification Types](#solid-specification-types) and
[Solid Language Types](#solid-language-types).



## Solid Specification Types
Solid Specification Types are only used internally within this specification to define and convey abstract concepts.
They are not directly observable from Solid code.


### Void
The **Void** type has no value, but signifies the completion of an algorithm.
The algorithm returns no value.


### RealNumber
The **RealNumber** type represents arbitrary real numbers used in specific situations.
Real numbers cannot be represented accurately in a computer program,
but are used in this specification to perform mathematically accurate computations.

Real numbers are subclassified into the following kinds. The kinds are not necessarily disjoint.

#### Real Integer Numbers
Real integer numbers are the whole numbers *1, 2, 3, …*, their negatives, and *0*.
The term “real integer number” is used to distinguish from [Solid Language Type Integers](#integer).
The real integer numbers refer to the well-understood set of integers in mathematics.
There is no least or greatest real integer number.

#### Real Rational Numbers
Real rational numbers are ratios of integers, the well-understood set of rational numbers in mathematics.
The term “real rational number” is used to distinguish from [Solid Language Type Floats](#float).
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
addition `+`, subtraction `-`, multiplication `*`, division `/`, and exponentiation `^`.
These operations are implied with their typical meaning in the context of real numbers.


### Sequence
A **Sequence** is an ordered list of values. The values may be a mix of any type.
If the values fall within a certain type `‹T›` (a metavariable),
the Sequence type is denoted `Sequence<‹T›>`.
For example, a sequence of Integers is denoted `Sequence<Integer>`.


### Structure
A **Structure** is an unordered list of name–value pairs. The names are unique words and the values may be any type.
A name–value pair of a structure is called a **property**.

#### CompletionStructure
A **CompletionStructure** is a specific subtype of [Structure](#structure) with two mandatory properties:
«type» and «value».
The «type» property must be one of the enumerated specification values
*normal*, *break*, *continue*, *return*, or *throw*, which are described below.
The «value» property must be a [Solid Language Value](#solid-language-types).

Completion structures are the default values returned by all specification algorithms,
unless explicitly stated otherwise.

This table summarizes the enumerated values of a completion structure’s «type» property.

Value      | Meaning
---------- | -------
*normal*   | TODO
*continue* | TODO
*break*    | TODO
*return*   | TODO
*throw*    | TODO

The term “abrupt completion” refers to any completion with a «type» other than *normal*.



## Solid Language Types
Solid Language Types characterize Solid Language Values, which are
values directly manipulated by a Solid program.

Solid has the following built-in types.
This list is not exhaustive, as Solid Types may be created in any Solid program.

- [Null](#null)
- [Boolean](#boolean)
- [Integer](#integer)
- Float
- String
- Object


### Null
The Null type has exactly one value, called `null`.


### Boolean
The Boolean type has two logical values, called `true` and `false`.


### Integer
The Integer type represents [mathematical integers](#realnumber).
The Solid compiler represents Integers as 16-bit signed two’s complement values.

`0` and `-0` represent the same value, *0*.
The maximum value of the Integer type is mathematically equal to
*2<sup>15</sup> &minus; 1 = 32,767 = FFFF<sub>16</sub>*.
The minimum value is mathematically equal to
*&minus;2<sup>15</sup> = &minus;32,768 = &minus;10000<sub>16</sub>*.

When performing arithmetic operations such as addition, subtraction, and multiplication,
computed values that are out of range will overflow as if doing modular arithmetic modulus *2<sup>16</sup>*,
offset towards negative infinity by *2<sup>15</sup>*.
For example, the sum represented by *32,767 + 1* will overflow and produce the value represented by *&minus;32,768*.
The behavior of performing arithmetic operations that are invalid in the integers
(such as dividing by a non-factor, or raising to a negative exponent) are defined in each respective operation.
Dividing by zero results in an error.
