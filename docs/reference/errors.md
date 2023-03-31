# Errors
This chapter describes compiler errors, their causes, and potential solutions.



## Syntax Errors (1xxx)
Syntax Errors arise when a Counterpoint source text does not adhere to the language’s
formal lexical or syntactic grammar rules.
If this is the case, the code is said to be “ill-formed” (“not well-formed”).

There are two main types of syntax errors: lexical errors and parse errors.


### Lexical Errors (11xx)
A lexical error is raised when the Counterpoint source text fails to produce a token per
the [lexical grammar](#the-lexical-grammar) rules.

1. 1100 — A general lexical error not covered by one of the following cases.
1. 1101 — The lexer reached a character that it does not recognize.
1. 1102 — The lexer reached the end of the file before it found the end of the current token.
1. 1103 — The lexer found an escape sequence of an invalid format.
1. 1104 — The lexer found a numeric separator where it is not allowed.
1. 1105 — The lexer found a float literal in an invalid format.


### Parse Errors (12xx)
A parse error is raised when the Counterpoint source text fails to parse correctly per
the [syntactic grammar](#the-syntactic-grammar) rules.

1. 1200 — A general parse error not covered by one of the following cases.
1. 1201 — The parser reached a token that the syntax does not allow.



## Semantic Errors (2xxx)
Semantic Errors arise when a Counterpoint source text does not adhere to the language’s
formal validation rules.
If this is the case, the code is said to be “invalid” (“not valid”).


### Reference Errors (21xx)
A reference error is raised when the compiler fails to dereference an identifier.

1.  2100         — A general reference error not covered by one of the following cases.
1. [2101](#2101) — The validator encountered a variable that was never declared.
1. [2102](#2102) — The validator encountered a variable that was used before it was declared.
1. [2103](#2103) — The validator encountered a symbol of the wrong kind.

#### 2101
Cause: A variable was referenced but was not declared.
```
my_var; % ReferenceError: `my_var` is never declared.
```
Solution(s): Ensure the variable, type, or parameter is declared before referencing it.

#### 2102
Cause: A variable was referenced before it was declared.
```
my_var;               % ReferenceError: `my_var` is used before it is declared.
let my_var: int = 42;
```
Solution(s): Ensure the variable or type is declared before referencing it.

#### 2103
Cause: A variable was used as a type, or a type was used as a variable.
```
let FOO: int = 42;
type T = FOO | float; % ReferenceError: `FOO` refers to a value, but is used as a type.

type BAR = int;
42 || BAR;      % ReferenceError: `BAR` refers to a type, but is used as a value.
```
Solution(s): Keep types and variables separate.


### Assignment Errors (22xx)
An assignment error is raised when the compiler detects an illegal declaration or assignment.

1.  2200         — A general assignment error not covered by one of the following cases.
1. [2201](#2201) — The validator encountered a duplicate declaration.
1. [2202](#2202) — The validator encountered a duplicate record key.
1. [2210](#2210) — A reassignment of a fixed variable was attempted.

#### 2201
Cause: A duplicate declaration was encountered.
```
let my_var: int = 42;
let my_var: int = 24; % AssignmentError: Duplicate declaration of `my_var`.

type MyType = int;
type MyType = float; % AssignmentError: Duplicate declaration of `MyType`.
```
Solution(s): Remove the duplicate declaration, or change it to a reassignment (if possible).

#### 2202
Cause: A duplicate key in a record/struct literal or type literal was encountered.
```
[foo= "a", foo= "b"]; % AssignmentError: Duplicate record key `foo`.

type MyType = [bar: int, bar: str]; % AssignmentError: Duplicate record key `bar`.
```
Solution(s): Remove or rename the duplicate key.

#### 2210
Cause: A fixed variable was reassigned.
```
let my_var: int = 42;
my_var = 24;          % AssignmentError: Reassignment of fixed variable `my_var`.
```
Solution(s): Remove the reassignment, or make the variable `unfixed`.


### Type Errors (23xx)
A type error is raised when the compiler recognizes a type mismatch.

1.  2300         — A general type error not covered by one of the following cases.
1. [2301](#2301) — The validator encountered an operation with an invalid operand.
1. [2302](#2302) — One type is expected to be a subtype of another, but is not.
1. [2303](#2303) — A reference type was encountered where a value type was expected.
1. [2304](#2304) — An expression was assigned to a type to which it is not assignable.
1. [2305](#2305) — The validator encountered a non-existent index/property/argument access.
1. [2306](#2306) — The validator encountered an attempt to call a non-callable object.
1. [2307](#2307) — An incorrect number of arguments is passed to a callable object.

#### 2301
Cause: An invalid operation was performed.
```
true + false; % TypeError: Invalid operation.
```
Solution(s): Only use operations on valid operands.

#### 2302
Cause: One type is expected to be a subtype of another type, but is not.
```
{"a" -> 1, "b" -> 2}.[1]; % TypeError: Type `1` is not a subtype of `"a" | "b"`.
```
Solution(s): Ensure the assigned type is a subtype of the assignee.

#### 2303
Cause: A reference type was used where a value type was expected.
```
type T = [int];
type U = \[str, T]; % TypeError: Got reference type `[int]`, but expected a value type.

let x: [int] = [42];
let y: obj = \["hello", x]; % TypeError: Got reference type `[int]`, but expected a value type.
```
Solution(s): Ensure only value types are used where expected.

#### 2304
Cause: A variable, property, or parameter was assigned an expression of an incorrect type.
```
let x: int = true;              % TypeError: Expression of type `true` is not assignable to type `int`.
((x: int): int => x + 1).(4.2); % TypeError: Expression of type `4.2` is not assignable to type `int`.
```
Solution(s): Ensure the expression has an assignable type.

#### 2305
Cause: A non-existent index, key, or parameter name was accessed.
```
[42, 420].2;                      % TypeError: Index `2` does not exist on type `[42, 420]`.
[a= 42, b= 420].c;                % TypeError: Property `c` does not exist on type `[a: 42, b: 420]`.
((x: int): int => x + 1).(y= 42); % TypeError: Parameter `y` does not exist on type `(x: int) => int`.
```
Solution(s): Ensure the index/property/parameter access has the correct index or name.

#### 2306
Cause: A non-callable object was called.
```
type U = int;
type T = U.<V>;  % TypeError: Type `U` is not callable.

let x: int = 42;
x.(24);          % TypeError: Type `int` is not callable.
```
Solution(s): Callable objects are limited to functions, generic type aliases, and generic type functions.

#### 2307
Cause: A function or generic call was given an incorrect number of arguments.
```
type U<V, W> = V | W;
type T = U.<V>;       % TypeError: Got 1 type arguments, but expected 2.

func x(y: int): int => y + 42;
x.(2, 4);                      % TypeError: Got 2 arguments, but expected 1.
```
Solution(s): Pass in an expected number of arguments.


### Mutability Errors (24xx)
A mutability error is raised when the compiler recognizes an attempt to mutate an immutable object.

1.  2400         — A general mutability error not covered by one of the following cases.
1. [2401](#2401) — An item or property of an immutable object was reassigned.

#### 2401
Cause: An immutable object was mutated.
```
let x: [a: int] = [a= 42];
x.a = 43;                  % MutabilityError: Mutation of an object of immutable type `[a: int]`.
```
Solution(s): Do not mutate the object’s entries, or else give it a `mutable` type.



## Runtime Errors (3xxx)
Runtime Errors arise when the program compiles successfully but fails to complete execution
as a result of some internal process.


### Void Errors (31xx)
A void error is raised when an expression that has no value is used in some way.
