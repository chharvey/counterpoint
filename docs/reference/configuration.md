# Solid Configuration
This chapter describes the ways in which Solid developers can configure their programs and compilers.



## Configuration Setup
TODO



## Configuration Options


### Features

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
@default true
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

#### `constantFolding`
```
@version v0.1.0
@type    boolean
@default true
```
Compute operations on literals at compile-time if possible.

If enabled, the compiler will attempt to calculate the values of expressions and sub-expressions
if they contain operations on literals.
For example, `(3 + 5) / 2` will be replaced with `4` at compile time.
The compiler will fold until it reaches an unknown: `(3 + 5) * n` will be replaced with `8 * n`.

If disabled, the compiler will not evaluate expressions; evaluation will be deferred until runtime.
