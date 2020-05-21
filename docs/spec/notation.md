# Notation
This chapter describes notational conventions used throughout this specification.



## Grammars


### Context-Free Grammars
Context-free grammars define the lexical and syntactic composition of Solid programs.

A context-free grammar consists of a number of **productions**, each of which
has an abstract symbol called a **nonterminal** as its left-hand side,
and any number of sequences of zero or more nonterminal and terminal symbols as its right-hand side.
For each grammar, the **terminal** symbols are drawn from a specified alphabet.

Starting from a sentence consisting of a single distinguished nonterminal,
called the goal symbol, a given context-free grammar specifies a language, namely,
the set of possible sequences of terminal symbols that can result from
repeatedly replacing any nonterminal in the sequence with a right-hand side of a production
for which the nonterminal is the left-hand side.

A **sequence** of symbols indicates that those symbols, in order,
can replace the nonterminal they define.
If multiple sequences define a nonterminal in a production,
then exactly one of those sequences may replace the nonterminal in the language
for any given replacement step.

#### Example
```
ExpressionAddition
	::= ExpressionAddition "+" NUMBER
	::= NUMBER
```
The grammar above is a very simple grammar with only one production, defined
by the nonterminal `ExpressionAddition` on the left-hand side and two sequences on the right-hand side.
The first sequence has three symbols: one nonterminal (which happens to be the same as the production —
recursion is allowed in this specification’s grammars), and two terminals.
The terminal `"+"` is a literal token, and the terminal `NUMBER` represents a token
that matches some lexical formula, such as `[0-9]*` (which might be defined in a separate lexical grammar).
In this specification, such terminal identifiers will be written in all-uppercase (‘MACRO_CASE’).

One is able to start with the nonterminal `ExpressionAddition`, and replace it with
any of the right-hand sequences, repeating that step perhaps an arbitrary number of times
if recursion is allowed, until no more nonterminals remain. The resulting sequence of terminals
would be a well-formed instance of the language.

#### The Lexical Grammar
A lexical grammar for the Solid programming language is a formal context-free grammar that has
as its terminal symbols the characters of the Unicode character set.
The lexical grammar is a set of productions that describes
how sequences of Unicode characters are translated into a sequence of input elements, called **tokens**.
These tokens form the terminal symbols for the syntactic grammar.

A lexer, a.k.a. tokenizer, is a mechanism that reads a stream of character inputs,
groups consecutive inputs into tokens based on the rules of the lexical grammar,
and then outputs that steam of tokens.
This process is called lexical analysis, or “lexing/tokenizing” for short.
When an input stream is successfully lexically analyzed without error, it is sent to a screener.

The screener, while not a part of the lexer, performs medial tasks that can be done during lexical analysis.
Such tasks prepare the tokens for the parser, such as computing the mathematical values and string values
of numeric tokens and string tokens respectively, as well as performing other optimizing techniques.
The screener is also responsible for deciding which tokens get sent to the parser.

#### The Syntactic Grammar
The syntactic context-free grammar for the Solid programming language has as its terminal symbols
the tokens defined by the lexical grammar, excluding certain tokens such as comments.
The syntactic grammar is a set of productions that describes
how sequences of tokens can form syntactically correct components of Solid programs.

A parser is a mechanism that performs syntactic analysis, or “parsing”: It reads a stream of token inputs,
and arranges them into a **parse tree** according to the rules of the syntactic grammar.
Unlike lexical analysis, which produces a linear stream of outputs, syntactical analysis
produces tokens arranged in a tree with a single root node and any number of children nodes.
Each (non-leaf) node of the tree corresponds to a nonterminal production in the grammar,
and has child nodes that correspond to the production’s sequence of symbols on its right-hand side.
The leaves of the tree (at the ends of the branches) are terminal symbols,
the tokens from the input stream.
After successful syntactical analysis, the parse tree is sent to a decorator.

The parser’s decorator is the analogue of the lexer’s transformer.
The responsibility of the decorator is to infer all the semantics it can,
based only on the syntactic structure of a given language instance.
This is made possible because context-sensitive clues are given once a parse tree is completed.
Further, the decorator transforms the very large parse tree into a more simplified and condensed
semantic tree, which is then passed on to a semantic analyzer.


### Attribute Grammars
Attribute grammars are context-sensitive grammars that help the decorator transform
the parse tree into the semantic tree, which is a prerequisite for semantic analysis.
In an attribute grammar, attributes are defined on nodes of a parse tree via the productions
of a context-free grammar.
In this specification, attributes are “synthesized” and thus propagate in a bottom-up manner:
given a parse node, computing an attribute of that node might require looking at its children.
Attributes can be computed values, or entire objects representing semantic nodes with children.
For example, an attribute grammar can be used to determine the mathematical value of a number.

#### Example
```
MV(NUMBER ::= [0-9])
	:= MV([0-9])
MV(NUMBER ::= NUMBER [0-9])
	:= 10 * MV(NUMBER) + MV([0-9])
MV([0-9] ::= "0") := 0
MV([0-9] ::= "1") := 1
...
MV([0-9] ::= "9") := 9
```
This example demonstrates an attribute grammar that defines an attribute called `MV` on a `NUMBER` token.
Each rule defines the attribute on the token matching a different pattern defined by a CFG.
The first line could be read aloud as, “The `MV` of `NUMBER` matching `[0-9]` is the `MV` of `[0-9]`.”

#### Token Value
The various token value grammars are attribute grammars that determine the semantic value of their respective token types.

- Punctuator Value
- Mathematical Value
- Keyword Value
- Identifier Value
- String Value
- Template Value

These token value grammars are described further in detail in the chapter
[Solid Language: Lexicon](./language-lexicon.md).

#### Decoration
The decoration grammar is the attribute grammar that defines the semantic value
of a syntactic production. The values of the productions in the decoration attribute grammar
are semantic nodes whose properties and children determine what code is to be generated by the compiler.
These semantics are called “static semantics” because they are performed
after syntactic analysis, but before the program is executed at run-time.

The productions of the decoration grammar are listed in the chapters
[Solid Language: Expressions](./language-expressions.md),
[Solid Language: Statements](./language-statements.md), and
[Solid Language: Goal Symbols](./language-goal.md).



## Algorithms
This specification uses abstract algorithms to describe the runtime behavior of a program.
The algorithms are called “abstract” since they do not specify an implementation technique or technology,
and their steps are written in prose.

An algorithm consists of a name and a sequence of steps, formatted as an ordered list.
The list is “ordered” in that the outcome could change if the steps were not performed in the order given.
Algorithm steps may include substeps, which are formatted by an additional indentation level.
Substeps may include their own “subsubsteps”, and so on, with each level corresponding to a new indentation.
Steps may be nested an arbitrary number of levels.

```w3c
AlgorithmName() :=
	1. Step 1.
	2. Step 2.
		1. Substep 2.1.
			1. Subsubstep 2.1.1.
		2. Substep 2.1.
	3. Step 3.
		1. Substep 3.1.
```

Algorithms may perform basic mathematical operations of numeric values, which include
addition `+`, subtraction `-`, multiplication `*`, division `/`, and exponentiation `^`.
These operations are implied with their typical meaning in the context of real and complex numbers,
but are specified in more detail under [Mathematical Operations] (link pending).

Algorithms may be referenced from one another.
Algorithms are written in parameterized functional form, with the algorithm name in CamelCase
and any parameters specified in parentheses after the algoritm name.
When the algorithm is referenced, arguments, if any, are listed after the name in the same manner.
Local variables, parameters, other algorithm names, and code snippets
referenced within the steps of an algorithm are delimited with \`back-ticks\`.


### Algorithm Steps
The steps allowed in an algorithm fall into categories, whose semantics are defined here.
If a step does not match one of the given categories, its behavior is open to interpretation.

#### Assert
Steps that begin with “Assert: …” are informative and are meant only to provide clarification to the reader.
These steps explicitly indicate that a conditon is true when it would otherwise only be implicit.

#### Perform
Steps that begin with “Perform: …” reference another algorithm expect it to be performed.
The current algorithm is halted on this step and waits for the referenced algorithm to complete before proceeding.

#### Let/Set
Algorithms may make the use of variable references, such as, “Let \`x\` be \`someValue\`.”
Such a step indicates that \`x\` is a pointer to the value \`someValue\`,
which itself may refer to a [Solid Language Value] (link pending), an [Internal Specification Value] (link pending),
or the result of performing another algorithm.

The variable \`x\` is treated as a pointer in that if \`someValue\` is mutated in some way,
then that effect will also be seen on \`x\`.
An algorithm may specify that a variable be reassigned, e.g., “Set \`x\` to \`someOtherValue\`.”
In that case, the pointer \`x\` is changed to the new value.

#### If/Else, While
Conditional and loop programming structures may appear in algorithms.
For conditionals, the *if* branch and *else* branch are parallel steps,
each containing the substeps respective to that branch.
(The *else* branch is not always necessary, e.g. if the *if* branch completes the algorithm.)
*If* steps begin with “If …:” and *else* steps begin with “Else:”.

A step that specifies a loop must have as its substeps the steps to be performed for each iteration.
A loop step begins with “While …:”

#### Return
Algorithms may have an output value, which is the result of performing the algorithm.
If one algorithm `A` is referenced by another, `B`, then the output value of `A` (if it exists) is given to `B`
in the step it was referenced.
An algorithm must output either no value or one value.
If an algorithm outputs a value, it must do so via a step beginning with “Return: …”.


### Runtime Instructions
Algorithms that specify behavior to be performed at runtime are called **runtime instructions**.
These algorithms are derived from the [static semantics](#decoration) of a program.
They pass instructions to the code generator,
which in turn generates compiled code to be executed at runtime.

The runtime instructions of static semantics are listed in the chapters
[Solid Language: Expressions](./language-expressions.md),
[Solid Language: Statements](./language-statements.md), and
[Solid Language: Goal Symbols](./language-goal.md).



## Syntax Errors (1xxx)
Syntax Errors arise when a Solid source text does not adhere to the language’s
formal lexical or syntactic grammar rules.
If this is the case, the code is said to be “not well-formed”.

There are two main types of syntax errors: lexical errors and parse errors.


### Lexical Errors (11xx)
When the Solid source text fails to produce a token per
the [lexical grammar](#the-lexical-grammar) rules,
a lexical error is raised.

1100. A general lexical error not covered by one of the following cases.
1101. The lexer reached a character that it does not recognize.
1102. The lexer reached the end of the file before it found the end of the current token.
1103. The lexer found an escape sequence of an invalid format.
1104. The lexer found a numeric separator where it is not allowed.


### Parse Errors (12xx)
When the Solid source text fails to parse correctly per
the [syntactic grammar](#the-syntactic-grammar) rules,
a parse error is raised.
