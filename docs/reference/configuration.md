# Counterpoint Configuration
This chapter describes the ways in which Counterpoint developers can configure their programs and compilers.



## Configuration Setup
A configuration file is the best way to manage configuration of your compiler instance.
It’s best to check-in your configuration file into source control.
Your configuration file must be a JSON file, and
it should be at the top level of your codebase, named `counterpoint-config.json`.
*Note: The filename doesn’t matter for now, but in the future this could be a convention. Check back here for updates.*
Your JSON file should be a single object, with two optional properties: `languageFeatures` and `compilerOptions`.
[Counterpoint API coming soon]

- Without a config file, the Counterpoint compiler will use the configuration default values, listed in the next section.
- To use a config file during compilation, you must specify it on the command line. Run `npx cplc --help` for details.
- Even with a config file, you may override it with per-option CLI arguments. Run `npx cplc --config` for details.

For example, the default value of an option `‹foo›` might be `true`.
If in your `counterpoint-config.json` you have `{"languageFeatures": {"foo": false}}`,
that would override the default. However, if you run
```shell
$ npx cplc c ./my-program.cpls -p=./counterpoint-config.json --foo
```
the `--foo` option would override your config file.



## Configuration Options


### `languageFeatures`
Language features are aspects of the Counterpoint Programming Language that may be enabled and disabled at will.

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


### `compilerOptions`
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
Disabling is useful for inspecting assembly code during development.
