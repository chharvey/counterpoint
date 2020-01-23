# Grammar

This chapter describes the context-free grammars used to define the lexical and syntactic structure of a Solid program.



## Context-Free Grammars
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

### Example
```
ExpressionAddition
	::= ExpressionAddition "+" NUMBER
	::= NUMBER
```
The grammar above is a very simple grammar with only two productions. The first production is defined
by the nonterminal `ExpressionAddition` on the left-hand side and two sequences on the right-hand side.
The first sequence has three symbols: one nonterminal (which happens to be the same as the production —
recursion is allowed in this specification’s grammars), and one two terminals.
The terminal `"+"` is a literal token, and the terminal `NUMBER` represents a token
that matches some lexical formula, such as `[0-9]*` (which might be defined in a separate lexical grammar).
In this specification, such terminal identifiers will be written in all-uppercase (‘MACRO_CASE’).

One is able to start with the nonterminal `ExpressionAddition`, and replace it with
any of the right-hand sequences, repeating that step perhaps an arbitrary number of times
if recursion is allowed, until no more nonterminals remain. The resulting sequence of terminals
would be a well-formed instance of the language.



## The Lexical Grammar
A lexical grammar for the Solid programming language is a formal context-free grammar that has
as its terminal symbols the characters of the Unicode character set.
The lexical grammar is a set of productions that describes
how sequences of Unicode characters are translated into a sequence of input elements, called **tokens**.
These tokens form the terminal symbols for the syntactic grammar.

A lexer, a.k.a. tokenizer, is a mechanism that reads a stream of character inputs,
groups consecutive inputs into tokens based on the rules of the lexical grammar,
and then outputs that steam of tokens.
This process is called lexical analysis, or “lexing/tokenizing” for short.
When an input stream is successfully lexically analyzed without error, it is sent to a transformer.

The transformer, while not a part of the lexer, performs medial tasks that can be done during lexical analysis.
Such tasks prepare the tokens for the parser, such as computing the mathematical values and string values
of numeric tokens and string tokens respectively, as well as performing other optimizing techniques.
The transformer is also responsible for deciding which tokens to send to the parser.



## The Syntactic Grammar
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



## Attribute Grammars
Attribute grammars are context-sensitive grammars that help the decorator transform
the parse tree into the semantic tree, which is a prerequisite for semantic analysis.
In an attribute grammar, attributes are defined on nodes of a parse tree via the productions
of a context-free grammar.
In this specification, attributes determined in a top-down manner: given a parse node,
computing an attribute of that node might require looking at its children.
Attributes can be computed values, or entire objects representing semantic nodes with children.
For example, an attribute grammar can be used to determine the mathematical value of a number.

### Example
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
