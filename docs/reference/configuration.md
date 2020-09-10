# Solid Configuration
This chapter describes the ways in which Solid developers can configure their programs and compilers.



## Configuration Setup
TODO



## Configuration Options


### Language Features
Language features are toggleable aspects of the Solid Programming Language.

#### `comments`
```
@version v0.2.0
@type    boolean
@default true
```
Allows lexing of comments in source code.
With this disabled, the compiler will not recognize comments:
```
% line comments

{% multiline
comments %}

%%%
block coments
%%%
```

#### `integerRadices`
```
@version v0.2.0
@type    boolean
@default false
```
Allows integers with a non-decimal radices.

With this feature enabled, integers can be written in five other bases in addition to the default base 10.
To write an integer in base 2, 4, 8, 16, or 36, prefix it with `\b`, `\q`, `\o`, `\x`, or `\z`, respectively.
(Integers can also be prefixed with `\d` for base 10.)

For example, `\xff` in hexadecimal (base 16) is `255` decimal (base 10), also written `\d255`.

Disabling this feature requires all integers to be written in base 10, in their non-prefixed form.

#### `numericSeparators`
```
@version v0.2.0
@type    boolean
@default false
```
Allows numeric separator symbols within number tokens.

If enabled, number tokens may contain underscore characters `_` to help visually group and separate the digits.
The numeric separator can only appear between digits, cannot appear at the beginning or end of a token,
and cannot appear consecutively (two or more in a row).

For example, `1_000_000` represents *1,000,000* and `\b1011_0100` represents *180*.

With this disabled, number tokens cannot contain the numeric separator character.


### Compiler Options
Compiler options control how source code is compiled into assembly code.

#### `constantFolding`
```
@version v0.1.0
@type    boolean
@default true
```
Computes constant expressions at compile-time.

If enabled, expressions with values known at compile-time will be computed and simplified in the ouptut.
For example, the expression `2 * (3 + 5)` is computable and will be reduced to `16` during compilation.

Constant folding encompasses short-circuited expressions,
and in this context is sometimes called “dead code elimination”.
E.g., `true || x` reduces to `true` and `false || x` reduces to `x`,
even though the value of `x` is not known at compile-time.
Similar reductions are made to conditional expressions.
If the compiler can determine the outcome of an expression based on a condition,
it will only produce assembly code for that output.

With this disabled, compilation will be faster,
but all computations and short-circuiting will take place at runtime.

#### `intCoercion`
```
@version v0.2.0
@type    boolean
@default true
```
Allows mixing integer and float operands in arithmetic expressions.

If enabled, allows expressions such as `2 + 3.0` where integer and float types may be mixed.
Before the computation is made, the integer operands are coerced into floats (e.g. becoming `2.0 + 3.0`).
If the value is known, the coercion is made at compile-time. If, however, the value is unknown
(e.g. `x + 3.0` where `x` is an integer), the coercion is made at runtime.

If disabled, mixing different numeric types will result in a type error.