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

1. 2100 — A general reference error not covered by one of the following cases.
1. 2101 — The validator encountered a variable that was never declared.
1. 2102 — The validator encountered a variable that was used before it was declared.
1. 2103 — The validator encountered a symbol of the wrong kind.


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
let my_var: int = 24; % AssignmentError: Duplicate declaration: `my_var` is already declared.

type MyType = int;
type MyType = float; % AssignmentError: Duplicate declaration: `MyType` is already declared.
```
Solution(s): Remove the duplicate declaration, or change it to a reassignment (if possible).

#### 2202
Cause: A duplicate key in a record/struct literal or type literal was encountered.
```
[foo= "a", foo= "b"]; % AssignmentError: Duplicate record key: `foo` is already set.

type MyType = [bar: int, bar: str]; % AssignmentError: Duplicate record key: `bar` is already set.
```
Solution(s): Remove or rename the duplicate key.

#### 2210
Cause: A fixed variable was reassigned.
```
let my_var: int = 42;
my_var = 24;          % AssignmentError: Reassignment of a fixed variable: `my_var`.
```
Solution(s): Remove the reassignment, or make the variable `unfixed`.


### Type Errors (23xx)
A type error is raised when the compiler recognizes a type mismatch.

1. 2300 — A general type error not covered by one of the following cases.
1. 2301 — The validator encountered an operation with an invalid operand.
1. 2302 — One type is expected to be a subtype of another, but is not.
1. 2303 — A reference type was encountered where a value type was expected.
1. 2304 — An expression was assigned to a type to which it is not assignable.
1. 2305 — The validator encountered a non-existent index/property/argument access.
1. 2306 — The validator encountered an attempt to call a non-callable object.
1. 2307 — An incorrect number of arguments is passed to a callable object.


### Mutability Errors (24xx)
A mutability error is raised when the compiler recognizes an attempt to mutate an immutable object.

1. 2400 — A general mutability error not covered by one of the following cases.
1. 2401 — An item or property of an immutable object was reassigned.



## Runtime Errors (3xxx)
Runtime Errors arise when the program compiles successfully but fails to complete execution
as a result of some internal process.


### Void Errors (31xx)
A void error is raised when an expression that has no value is used in some way.
