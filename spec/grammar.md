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



## The Lexical Grammar
A lexical grammar for the Solid programming language is a formal context-free grammar that has
as its terminal symbols the characters of the Unicode character set.
The lexical grammar is a set of productions that describes
how sequences of Unicode characters are translated into a sequence of input elements, called tokens.
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
The leaves of the tree (at the ends of the branches), are terminal symbols,
the tokens from the input stream.
