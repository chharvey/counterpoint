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

1100. A general lexical error not covered by one of the following cases.
1101. The lexer reached a character that it does not recognize.
1102. The lexer reached the end of the file before it found the end of the current token.
1103. The lexer found an escape sequence of an invalid format.
1104. The lexer found a numeric separator where it is not allowed.
1105. The lexer found a float literal in an invalid format.


### Parse Errors (12xx)
A parse error is raised when the Counterpoint source text fails to parse correctly per
the [syntactic grammar](#the-syntactic-grammar) rules.

1200. A general parse error not covered by one of the following cases.
1201. The parser reached a token that the syntax does not allow.



## Semantic Errors (2xxx)
Semantic Errors arise when a Counterpoint source text does not adhere to the language’s
formal validation rules.
If this is the case, the code is said to be “invalid” (“not valid”).


### Reference Errors (21xx)
A reference error is raised when the compiler fails to dereference an identifier.

2100. A general reference error not covered by one of the following cases.
2101. The validator encountered a variable that was never declared.
2102. The validator encountered a variable that was used before it was declared.
2103. The validator encountered a symbol of the wrong kind.


### Assignment Errors (22xx)
An assignment error is raised when the compiler detects an illegal declaration or assignment.

2200. A general assignment error not covered by one of the following cases.
2201. The validator encountered a duplicate declaration.
2202. The validator encountered a duplicate record key.
2210. A reassignment of a fixed variable was attempted.


### Type Errors (23xx)
A type error is raised when the compiler recognizes a type mismatch.

2300. A general type error not covered by one of the following cases.
2301. The validator encountered an operation with an invalid operand.
2302. One type is expected to be a subtype of another, but is not.
2303. A reference type was encountered where a value type was expected.
2304. An expression was assigned to a type to which it is not assignable.
2305. The validator encountered a non-existent index/property/argument access.
2306. The validator encountered an attempt to call a non-callable object.
2307. An incorrect number of arguments is passed to a callable object.


### Mutability Errors (24xx)
A mutability error is raised when the compiler recognizes an attempt to mutate an immutable object.

2400. A general mutability error not covered by one of the following cases.
2401. An item or property of an immutable object was reassigned.



## Runtime Errors (3xxx)
Runtime Errors arise when the program compiles successfully but fails to complete execution
as a result of some internal process.


### Void Errors (31xx)
A void error is raised when an expression that has no value is used in some way.
