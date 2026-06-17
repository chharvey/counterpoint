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

1.  2100                                  — A general reference error not covered by one of the following cases.
1. [2101](#2101-referenceerrorundeclared) — The validator encountered a variable that was never declared.
1. [2102](#2102-referenceerrordeadzone)   — The validator encountered a variable that was used before it was declared.
1. [2103](#2103-referenceerrorkind)       — The validator encountered a symbol of the wrong kind.

#### 2101: ReferenceErrorUndeclared
Cause: A variable was referenced but was not declared.
```
my_var; % ReferenceErrorUndeclared: `my_var` is never declared.
```
Solution(s): Ensure the variable, type, or parameter is declared before referencing it.

#### 2102: ReferenceErrorDeadZone
Cause: A variable was referenced before it was declared.
```
my_var;               % ReferenceErrorDeadZone: `my_var` is used before it is declared.
val my_var: int = 42;
```
Solution(s): Ensure the variable or type is declared before referencing it.

#### 2103: ReferenceErrorKind
Cause: A variable was used as a type, or a type was used as a variable.
```
val FOO: int = 42;
type T = FOO | float; % ReferenceErrorKind: `FOO` refers to a value, but is used as a type.

type BAR = int;
42 || BAR;      % ReferenceErrorKind: `BAR` refers to a type, but is used as a value.
```
Solution(s): Keep types and variables separate.


### Assignment Errors (22xx)
An assignment error is raised when the compiler detects an illegal declaration or assignment.

1.  2200                                             — A general assignment error not covered by one of the following cases.
1. [2201](#2201-assignmenterrorduplicatedeclaration) — The validator encountered a duplicate declaration.
1. [2202](#2202-assignmenterrorduplicatekey)         — The validator encountered a duplicate record/dict key.
1. [2210](#2210-assignmenterrorreassignment)         — A reassignment of a read-only variable was attempted.
1. [2211](#2211-assignmenterrordeletion)             — A deletion of a non-optional variable was attempted.
1. [2220](#2220-assignmenterrormissingtype)          — A symbol was declared without a type annotation and initialized to a value ineligible for type inference.

#### 2201: AssignmentErrorDuplicateDeclaration
Cause: A duplicate declaration was encountered.
```
val my_var: int = 42;
val my_var: int = 24; % AssignmentErrorDuplicateDeclaration: Duplicate declaration of `my_var`.

type MyType = int;
type MyType = float; % AssignmentErrorDuplicateDeclaration: Duplicate declaration of `MyType`.
```
Solution(s): Remove the duplicate declaration, or change it to a reassignment (if possible).

#### 2202: AssignmentErrorDuplicateKey
Cause: A duplicate key in a record type, record literal, or dict literal was encountered.
```
type MyType = (bar: int, bar: str); % AssignmentErrorDuplicateKey: Duplicate record/dict key `bar`.

(foo= "a", foo= "b"); % AssignmentErrorDuplicateKey: Duplicate record/dict key `foo`.
[foo= "a", foo= "b"]; % AssignmentErrorDuplicateKey: Duplicate record/dict key `foo`.
```
Solution(s): Remove or rename the duplicate key.

#### 2210: AssignmentErrorReassignment
Cause: A read-only variable was reassigned.
```
val my_var: int = 42;
set my_var = 24;      % AssignmentErrorReassignment: Reassignment of read-only variable `my_var`.
```
Solution(s): Remove the reassignment statement, or declare the variable with `mut`.

#### 2211: AssignmentErrorDeletion
Cause: A non-optional variable was deleted.
```
val mut my_var: int | null = 42;
delete my_var;                   % AssignmentErrorDeletion: Deletion of non-optional variable `my_var`.
```
Solution(s): Remove the deletion statement, or remove the variable’s initializer.

#### 2220: AssignmentErrorMissingType
Cause: A variable, parameter, or field was declared without a type annotation when it is not eligible for type inference.
```cpl
val a = 42 + 1;                 % AssignmentErrorMissingType: Variable `a` is missing a type annotation.
func f(b? = 42 + 1): int => -b; % AssignmentErrorMissingType: Parameter `b` is missing a type annotation.
class Foo {
	public c = 42 + 1; % AssignmentErrorMissingType: Field `c` is missing a type annotation.
}
```
Solution(s): Add an explicit type annotation, update the symbol’s initializer to be eligible for type inference, or remove the declaration.


### Type Errors (23xx)
A type error is raised when the compiler recognizes a type mismatch.

1.  2300                                   — A general type error not covered by one of the following cases.
1. [2301](#2301-typeerrorinvalidoperation) — The validator encountered an operation with an invalid operand.
1. [2302](#2302-typeerrornotnarrow)        — One type is expected to be a subtype of another, but is not.
1. [2303](#2303-typeerrornotassignable)    — An expression was assigned to a type to which it is not assignable.
1. [2304](#2304-typeerrornoentry)          — The validator encountered a non-existent index/property/argument access.
1. [2305](#2305-typeerrornotcallable)      — The validator encountered an attempt to call a non-callable object.
1. [2306](#2306-typeerrorargcount)         — An incorrect number of arguments was passed to a callable object.

#### 2301: TypeErrorInvalidOperation
Cause: An invalid operation was performed.
```
true + false; % TypeError: Invalid operation.
```
Solution(s): Only use operations on valid operands.

#### 2302: TypeErrorNotNarrow
Cause: One type is expected to be a subtype of another type, but is not.
```
{"a" -> 1, "b" -> 2}.[1]; % TypeError: Type `1` is not a subtype of `"a" | "b"`.
```
Solution(s): Ensure the assigned type is a subtype of the assignee.

#### 2303: TypeErrorNotAssignable
Cause: A variable, property, or parameter was assigned an expression of an incorrect type.
```
val x: int = true;               % TypeError: Expression `true` is not assignable to type `int`.
(\(x: int): int => x + 1).(4.2); % TypeError: Expression `4.2` is not assignable to type `int`.
```
Solution(s): Ensure the expression has an assignable type.

#### 2304: TypeErrorNoEntry
Cause: A non-existent index, key, or parameter name was accessed.
```
(42, 420).2;                      % TypeError: Index `2` does not exist on type `(42, 420)`.
(a= 42, b= 420).c;                % TypeError: Property `c` does not exist on type `(a: 42, b: 420)`.
((x: int): int => x + 1).(y= 42); % TypeError: Parameter `y` does not exist on type `(x: int) => int`.
```
Solution(s): Ensure the index/property/parameter access has the correct index or name.

#### 2305: TypeErrorNotCallable
Cause: A non-callable object was called.
```
type U = int;
type T = U.<V>;  % TypeError: Type `U` is not callable.

val x: int = 42;
x.(24);          % TypeError: Type `int` is not callable.
```
Solution(s): Callable objects are limited to functions, generic type aliases, and generic type functions.

#### 2306: TypeErrorArgCount
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

1.  2400                           — A general mutability error not covered by one of the following cases.
1. [2401](#2401-mutabilityerror01) — An item or property of an immutable object was reassigned or deleted.

#### 2401: MutabilityError01
Cause: An immutable object was mutated.
```
val x: (a: int) = (a= 42);
set x.a = 43;              % MutabilityError: Mutation of an object of immutable type `(a: int)`.
```
Solution(s): Do not mutate the object’s entries, or else give it a `mut` type.



## Runtime Errors (3xxx)
Runtime Errors arise when the program compiles successfully but fails to complete execution
as a result of some internal process.


### Void Errors (31xx)
A void error is raised when an operation cannot produce a value when it is expected to do so.

1.  3100                              — A general void error not covered by one of the following cases.
1. [3301](#3301-voiderroroutofbounds) — An attempt was made to access a collection given an accessor beyond the collection’s bounds.

#### 3101: VoidErrorOutOfBounds
Cause: A list was accessed at an index greater than or equal to its length,
or a dict or map was accessed at a key that it does not have.
```
["earth", "wind", "fire"].[4]; % VoidErrorOutOfBounds

[
	socrates=  "earth",
	plato=     "wind",
	aristotle= "fire",
].[@pythagoras]; % VoidErrorOutOfBounds
```
Solution(s): Access collections only at existing indices/keys,
iterate over them dynamically using loops or list iteration methods,
or use the maybe access operator.


### Nan Errors (32xx)
A Nan error is raised when a numerical expression does not successfully evaluate.

1.  3200                         — A general nan error not covered by one of the following cases.
1. [3201](#3201-nanerrorinvalid) — The value is not a valid number.
1. [3202](#3202-nanerrordivzero) — Division by zero.

#### 3201: NanErrorInvalid
Cause: The expression could be a numerical value but is not valid in the language.
```
-4 ^ -0.5; % NanError: Not a valid number.
```
Solution(s): Only use valid mathematical operations.

#### 3202: NanErrorDivZero
Cause: The expression results in a division by zero.
```
3 / 0; % NanError: Division by zero.
```
Solution(s): Don’t divide by zero.
