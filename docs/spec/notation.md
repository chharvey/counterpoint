# Notation
This chapter describes notational conventions used throughout this specification.



## Value Notation
Snippets of specification text are delimited with double-angle quotes (**U+00AB**, **U+00BB**).
Below is an example of
prose that might appear in this specification; the double-angle quotes refer to wording used in the
steps of a hypothetical [specification algorithm](#algorithms).
> In an algorithm, a step that reads «*Let* \`x\` be the value of \`X\`.» means to say
> «If \`X\` is a completion structure, then let \`x\` be \`X.value\`; otherwise let \`x\` be \`X\`.»

Algorithm variables, values, and identifiers are delimited with \`back-ticks\` (**U+0060**) as illustrated above.

Snippets of program code (be it a Counterpoint program or another kind of program such as a context-free grammar)
are written in `monospace font`.
> The Counterpoint code `let x: int = X.value;` is a statement
> that assigns the `value` property of `X` to the newly declared variable `x`.
>
> The grammar production `N ::= A B` defines the nonterminal `N` as a concatenation of nonterminals `A` and `B`.

Metavariables are variables used within this specification as placeholder values.
They are delimited with single-angle quotes (**U+2039**, **U+203A**).
In the following example, \`‹T›\` and \`‹U›\` are not actual Counterpoint Language Types,
but placeholders for such types.
> If \`‹T›\` and \`‹U›\` are Counterpoint Language Types, then \`Or<‹T›, ‹U›>\` is the Counterpoint Language Type
> that contains values of either type \`‹T›\` or type \`‹U›\` (or both).


### Counterpoint Specification Values
[Counterpoint Specification Values](./data-types.md#counterpoint-specification-types) are indicated with an *italic typeface*.
For instance, a sequence of real numbers can be written as *[2, 4, 6]*.

#### Sequences
Sequences are denoted within square brackets (**U+005B**, **U+005D**), with comma-separated (**U+002C**) entries.
The notation *[`1685`, `"Bach"`]* represents a sequence containing two items:
the [Integer](./data-types.md#integer) representing the real number *1685*,
and the [String value](./data-types.md#string) `"Bach"`.

Fixed entries of a sequence may be accessed using 0-origin dot notation (**U+002E**).
If the example sequence above were assigned to the specification variable \`bach\`,
then \`bach.0\` is shorthand for «the 0th entry of \`bach\`», which is the value `1685`.

Variable entries of a sequence may be accessed using bracket notation.
For example, using a variable index \`i\` we may access «the *i*th entry of \`bach\`» via \`bach\[i\]\`.

#### Structures
Structures are denoted with left and right square brackets,
and name–value pairs are delimited with equals signs (**U+003D**).
For example, a structure with a \`name\` property of `"Bach"` and a \`yob\` property of `1685`
would be written as *[name= `"Bach"`, yob= `1685`]*.

Entries of a structure can be accessed using dot notation.
If the example structure above were assigned to the specification variable \`bach\`,
then \`bach.name\` is shorthand for «the \`name\` property of \`bach\`», which is the value `"Bach"`.


### Counterpoint Language Values
[Counterpoint Language Values](./data-types.md#counterpoint-language-types) are displayed with a `monospace typeface`.
Examples include `true`, `42.0`, and `"hello"`.
There is no notational distinction between Counterpoint Language Values and longer code snippets
such as `let n: int = 42;`; however, the semantics will be apparent in context.



## Context-Free Grammars
Context-free grammars define the lexical and syntactic composition of Counterpoint programs.

A context-free grammar consists of a number of **productions**, each of which
defines an abstract symbol called a **nonterminal** by
one or more sequences of zero or more nonterminal and **terminal** symbols.
For each grammar, the terminal symbols are drawn from a specified alphabet.

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
ExpressionAddition ::=
	| ExpressionAddition "+" NUMBER
	| NUMBER
;
```
The grammar above is a very simple grammar with only one production, defined
by the nonterminal `ExpressionAddition` on the left-hand side and two sequences on the right-hand side.
The first sequence has three symbols: one nonterminal (which happens to be the same as the production —
recursion is allowed in this specification’s grammars), and two terminals.
The terminal `"+"` is a literal token, and the terminal `NUMBER` represents a token
that matches some lexical formula, such as `[0-9]+` (which might be defined in a separate lexical grammar).

One is able to start with the nonterminal `ExpressionAddition`, and replace it with
any of the right-hand sequences, repeating that step perhaps an arbitrary number of times
if recursion is allowed, until no more nonterminals remain. The resulting sequence of terminals
would be a well-formed instance of the language.


### The Lexical Grammar
A lexical grammar for the Counterpoint Programming Language is a formal context-free grammar that has
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


### The Syntactic Grammar
The syntactic context-free grammar for the Counterpoint Programming Language has as its terminal symbols
the tokens defined by the lexical grammar, excluding certain tokens such as comments.
The syntactic grammar is a set of productions that describes
how sequences of tokens can form syntactically correct components of Counterpoint programs.

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


### CFG Notation
This specification uses a variant of [W3C’s EBNF syntax](https://www.w3.org/TR/xml/#sec-notation)
to notate the formal grammars of a language.

The [EBNF syntax grammar](./grammar-ebnf/syntax.ebnf) describes the formal Context-Free Grammar notation.
It is self-describing; that is, it describes the very syntax it uses.
The non-literal terminal symbols of this syntax grammar are defined in
a separate [lexical grammar](./grammar-ebnf/lexicon.ebnf).

Each production in a Grammar consists of a nonterminal followed by a choice of one or more sequences.
```
‹ProductionName›
	::= ‹Choice›;
```
where `‹ProductionDefinition›` and `‹Choice›` are meta-variables repesenting structures in the grammar.
`‹ProductionName›` represents a name of the nonterminal being defined,
and `‹Choice›` represents any sequence of symbols that may replace the nonterminal,
or a choice of such sequences.

For brevity, we may use the format
```
‹ProductionDefinition› ::= ‹Choice›;
```

The production definition is followed by a definition symbol `:::=` or `::=`, and the production is ended by `;`.
The symbol `:::=` is used in lexical grammars and the symbol `::=` is used in syntactic grammars.
In this section, we will use `::=` in the absense of context.

The nonterminal representative `‹Choice›` may define one or more alternatives
for **sequences** that replace the nonterminal `‹ProductionDefinition›`.
In that case, we delimit the sequences with pipes (**U+007C**),
and place each sequence on its own line.
```
‹ProductionDefinition› ::=
	| ‹Sequence1›
	| ‹Sequence2›
	| ‹Sequence3›
;
```
In this format, the pipes are to be thought of as *delimiters* rather than as *operators*,
though [they serve the same purpose](#alternation).
The list of sequences may begin with a leading pipe as shown above.

When describing Grammars, this specification uses PascalCase (TitleCase) to denote nonterminal symbols,
"double quotes" to denote literal terminals, and MACRO_CASE to denote non-literal terminal symbols.
For example, the following production defines a nonterminal `PrimitiveLiteral`,
which during syntactical analysis is replaced by one of five alternatives:
one of the terminal literals `"null"`, `"false"`, or `"true"`, or one of the terminal symbols `INTEGER` or `FLOAT`.
The latter two symbols are not literal spans of code, but rather productions defined by a separate lexical grammar.
(E.g., `INTEGER` could be defined lexically as `[0-9]+`.)
```
PrimitiveLiteral ::=
	| "null"
	| "false"
	| "true"
	| INTEGER
	| FLOAT
;
```

A **sequence** of symbols in a CFG is defined as a list of symbols
that may replace a nonterminal in exactly the same order.
Symbols in a sequence are concatenated with only whitespace separating them.
```
ExpressionUnit
	::= "(" Expression ")";
```
During syntactical analysis, the nonterminal `ExpressionUnit` may be replaced by
the terminal `"("`, followed by the nonterminal `Expression`, followed by the terminal `")"`.

EBNF **comments** are snippets of text ignored by any EBNF parser;
they can be used to insert human-readable descriptions.
Comments are written `// in C-style line comment syntax`,
and, if present, must appear at the end of a line.

#### Operations
This specification supplements the formal EBNF grammar described above
with an operational shorthand syntax to ease readability and length.
Specifically, the supplemented symbols include `( ) . & | + * # ?`.

This supplemental shorthand notation does not alter or add new semantics
to the formal EBNF grammar, but merely provides a route to transform productions
from their shorthand form to a number of productions in their formal form.

These shorthand notations are described in the following subsections.

##### Summary
The following table is an informative summary of the operators described below.

<table>
	<thead>
		<tr>
			<th>Precedence<br/><small>(1 is highest)</small></th>
			<th>Operator Name</th>
			<th>Arity &amp; Position</th>
			<th>Grouping</th>
			<th>Symbols</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<th>1</th>
			<td>Grouping</td>
			<td>unary wrap</td>
			<td>(n/a)</td>
			<td><code>( … )</code></td>
		</tr>
		<tr>
			<th rowspan="3">2</th>
			<td>Repetition</td>
			<td rowspan="3">unary postfix</td>
			<td rowspan="3">left-to-right</td>
			<td><code>… +</code></td>
		</tr>
		<tr>
			<td>Optional Repetition</td>
			<td><code>… *</code></td>
		</tr>
		<tr>
			<td>Comma-Separated Repition</td>
			<td><code>… #</code></td>
		</tr>
		<tr>
			<th>3</th>
			<td>Optionality</td>
			<td>unary postfix</td>
			<td>left-to-right</td>
			<td><code>… ?</code></td>
		</tr>
		<tr>
			<th rowspan="2">4</th>
			<td>Ordered Concatenation</td>
			<td rowspan="2">binary infix</td>
			<td rowspan="2">left-to-right</td>
			<td><code>… …</code></td>
		</tr>
		<tr>
			<td>Ordered Concatenation (Explicit)</td>
			<td><code>… . …</code></td>
		</tr>
		<tr>
			<th>5</th>
			<td>Unordered Concatenation</td>
			<td>binary infix</td>
			<td>left-to-right</td>
			<td><code>… & …</code></td>
		</tr>
		<tr>
			<th>6</th>
			<td>Alternation</td>
			<td>binary infix</td>
			<td>left-to-right</td>
			<td><code>… | …</code></td>
		</tr>
	</tbody>
</table>

##### Grouping
Grouping of symbols promotes the precedence of operations listed in the subsequent sections.

Grouping syntax uses the delimiters `( … )`.
```
N
	::= A (B C) D;
```

##### Ordered Concatenation
Ordered Concatenation is exactly the same as a sequence of symbols as described above.

Ordered Concatenation syntax uses the optional symbol `.`, but it is equivalent to whitespace.
```
N
	::= A . B;
```
is equivalent to
```
N
	::= A B;
```

Usage of an explicit operator can help control grouping and separation of items in a sequence.

##### Unordered Concatenation
Unordered Concatenation of symbols is concatenation where the order is not important.

Unordered Concatenation syntax uses the symbol `&` and is shorthand for an alternative choice with concatenation:
```
N
	::= A & B;
```
transforms to
```
N ::=
	| A B
	| B A
;
```

Unordered Concatenation is evaluated left-to-right, so the EBNF expression `A & B & C`
is equivalent to `(A & B) & C`.
```
N
	::= A & B & C;
```
transforms to
```
N ::=
	| (A & B) C
	| C (A & B)
;
```
which in turn transforms to
```
N ::=
	| A B C
	| B A C
	| C A B
	| C B A
;
```
**(Notice that not all permutations are available here — namely, `A C B` and `B C A` are missing.)**

Unordered Concatenation is weaker than concatenation:
`A & B C` is equivalent to `A & (B C)`.

##### Alternation
Alternation of symbols indicates an alternative choice of those symbols in the formal grammar.

Alteration syntax uses the symbol `|` and is shorthand for an alternative choice for a production:
```
N
	::= A | B;
```
transforms to
```
N ::=
	| A
	| B
;
```

Alternation is evaluated left-to-right, so the EBNF expression `A | B | C`
is equivalent to `(A | B) | C`.
```
N
	::= A | B | C;
```
transforms to
```
N ::=
	| A | B
	| C
;
```
which in turn transforms to
```
N ::=
	| A
	| B
	| C
;
```

Alternation is weaker than Unordered Concatenation:
`A | B & C` is equivalent to `A | (B & C)`.

Alternation on its own is not that interesting, but it can be useful when combined with other operations:
```
N ::= (A | B) C;
```
is shorthand for
```
N ::=
	| A C
	| B C
;
```

##### Repetition
Repetition indicates one or more occurrences of a symbol in the formal grammar.

Repetition syntax uses the symbol `+` and is shorthand for a left-recursive list:
```
N
	::= A B+ C;
```
transforms to
```
N
	::= A N__0__List C;

N__0__List ::=
	| B
	| N__0__List B
;
```

Repetition is stronger than concatenation:
`A B+` is equivalent to `A (B+)`.

##### Optional Repetition
Optional repetition is the repetition of zero or more occurrences of a symbol on the formal grammar.

Optional repetition uses the symbol `*` and is shorthand for a repetition that may be present or absent:
```
N
	::= A B* C;
```
is shorthand for
```
N
	::= A B+? C;
```

Optional repetition is stronger than concatenation:
`A B*` is equivalent to `A (B*)`.

##### Comma-Separated Repetition
Comma-separated repetition is a repetition of one or more items with commas (**U+002C**) in between them.
Comma-separated repetition only specifies commas *between* the items, but does not necessarily
specify a leading or trailing comma.

Comma-separated repetition syntax uses the symbol `#` and is shorthand for a left-recursive list.
```
N
	::= A B# C;
```
transforms to
```
N
	::= A N__0__List C;

N__0__List ::=
	| B
	| N__0__List "," B
;
```

Comma-separated repetition is stronger than concatenation:
`A B#` is equivalent to `A (B#)`.

##### Optionality
Optionality indicates that the symbol may be present or absent in the formal grammar.

Optionality syntax uses the symbol `?` and is shorthand for an alternative choice:
```
N
	::= A B? C;
```
transforms to
```
N ::=
	| A C
	| A B C
;
```

Optionality is stronger than concatenation:
`A B?` is equivalent to `A (B?)`.
However, it is the weakest of all unary operators:
`C+?`, `D*?`, and `E#?` are respectively equivalent to `(C+)?`, `(D*)?`, and `(E#)?`.

#### Parameterized Productions
Parameterized productions are syntax sugar for decreasing the
amount and effort of hand-written productions.
These are not new features; they are only shorthand notation that
reduce to the normative notation described at the beginning of this section.

##### Production Parameters
A parameter of a nonterminal on the left-hand side of a production
takes the form of an identifier, which expands the production into two productions.
```
N<X>
	::= A;
```
transforms to
```
N   ::= A;
N_X ::= A;
```
Production parameters expand combinatorially.
```
N<X, Y>
	::= A;

M<Z><W>
	::= B;
```
transforms to
```
N     ::= A;
N_X   ::= A;
N_Y   ::= A;
N_X_Y ::= A;

M     ::= B;
M_Z   ::= B;
M_W   ::= B;
M_Z_W ::= B;
```
Therefore, a nonterminal on the left-hand side `P<F, G>` is equivalent to `P<F><G>`.

##### Production Arguments
When a parameterized production is referenced as a nonterminal on the right-hand side,
identifiers are sent as arguments, which determine the production used.
```
N ::=
	| A<+X>
	| B<-X>
;

M<Y>
	::= C<?Y>;
```
transforms to
```
N ::=
	| A_X
	| B
;

M   ::= C;
M_Y ::= C_Y;
```
Production arguments expand combinatorially, the same way parameters do.
```
N ::=
	| I<-X, +X>
	| J<+Y, -Y>
	| K<-X><+X>
	| L<+Y><-Y>
;

M ::=
	| A<+X, +Y>
	| B<+X, -Y>
	| C<-X, +Y>
	| D<-X, -Y>
	| E<+X><+Y>
	| F<+X><-Y>
	| G<-X><+Y>
	| H<-X><-Y>
;

O<Z, W> ::=
	| P<?Z, ?W>
	| Q<?Z><?W>
;
```
transforms to
```
N ::=
	| I
	| I_X
	| J_Y
	| J
	| K_X
	| L_Y
;

M ::=
	| A_X
	| A_Y
	| A_X_Y
	| B_X
	| B
	| C
	| C_Y
	| D
	| E_X_Y
	| F_X
	| G_Y
	| H
;

O ::=
	| P
	| Q
;
O_Z ::=
	| P_Z
	| Q_Z
;
O_W ::=
	| P_W
	| Q_W
;
O_Z_W ::=
	| P_Z_W
	| Q_Z_W
;
```
Notice that a nonterminal on the right-hand side `P<⊛F, ⊗G>` is *not* equivalent to `P<⊛F><⊗G>`.
(`⊛` and `⊗` are metavariables representing one of the symbols `+` and `-`.)
The former (`P<⊛F, ⊗G>`) acts like a disjunction (`P<⊛F> | P<⊗G> | P<⊛F><⊗G>`), while
the latter (`P<⊛F><⊗G>`) acts like a conjunction (only `P<⊛F><⊗G>`).

However, a nonterminal on the right-hand side `P<?F, ?G>` *is* equivalent to `P<?F><?G>`.

##### Production Conditionals
A production conditional determines whether or not an item appears in the sequence of a production.
```
N<X> ::=
	| A
	| <X+>B
	| <X->C
;
```
transforms to
```
N ::=
	| A
	| C
;
N_X ::=
	| A
	| B
;
```
Production conditionals expand combinatorially.
```
N<X, Y> ::=
	| A
	| <X+>B
	| <X->C
	| <Y+>D
	| <Y->E
	| <X+, Y+>F
	| <X+, Y->G
	| <X-, Y+>H
	| <X-, Y->I
	| <X+><Y+>J
	| <X+><Y->K
	| <X-><Y+>L
	| <X-><Y->M
;

O<X> ::=
	| <X+, X+>P
	| <X+, X->Q
	| <X-, X+>R
	| <X-, X->S
	| <X+><X+>T
	| <X+><X->U
	| <X-><X+>V
	| <X-><X->W
;
```
transforms to
```
N ::=
	| A
	| C
	| E
	| G
	| H
	| I
	| M
;
N_X ::=
	| A
	| B
	| E
	| F
	| G
	| I
	| K
;
N_Y ::=
	| A
	| C
	| D
	| F
	| H
	| I
	| L
;
N_X_Y ::=
	| A
	| B
	| D
	| F
	| G
	| H
	| J
;


O ::=
	| Q
	| R
	| S
	| W
;
O_X ::=
	| P
	| Q
	| R
	| T
;
```
Notice that the conditional `<F⊛, G⊗>P` is *not* equivalent to `<F⊛><G⊗>P`.
(`⊛` and `⊗` are metavariables representing one of the symbols `+` and `-`.)
The former acts like a union whereas the latter acts like an intersection.

This informative table summarizes the right-hand side appearances.

|           | N   | N_X   | N_Y   | N_X_Y
----------- | --- | ----- | ----- | ------
`A`         | `N` | `N_X` | `N_Y` | `N_X_Y`
`<X+>B`     |     | `N_X` |       | `N_X_Y`
`<X->C`     | `N` |       | `N_Y` |
`<Y+>D`     |     |       | `N_Y` | `N_X_Y`
`<Y->E`     | `N` | `N_X` |       |
—           | `N` |       |       | `N_X_Y`
—           |     | `N_X` | `N_Y` |
`<X+, Y+>F` |     | `N_X` | `N_Y` | `N_X_Y`
`<X+, Y->G` | `N` | `N_X` |       | `N_X_Y`
`<X-, Y+>H` | `N` |       | `N_Y` | `N_X_Y`
`<X-, Y->I` | `N` | `N_X` | `N_Y` |
`<X+><Y+>J` |     |       |       | `N_X_Y`
`<X+><Y->K` |     | `N_X` |       |
`<X-><Y+>L` |     |       | `N_Y` |
`<X-><Y->M` | `N` |       |       |
`<X+><X->O` |     |       |       |



## Tree Node Schema Grammar
The tree node schema grammar describes nodes and their children in a tree.
A **tree** is a directed acyclic graph with a unique root node and the property that
every pair of nodes is connected by exactly one path.
A **node** is an object that has exactly one parent (unless it is the root, which has zero parents)
and any number of node attributes.
A **node attribute** is a named property of the node that contains a value.
Node attributes are not to be confused with parse node attributes,
which are defined by [attribute grammars](#attribute-grammars).

The tree node schema language is an abstraction of the [context-free grammar](#context-free-grammars) language,
and indeed, parse trees, which are generated by CFGs, meet the definition of **tree** above.
This specification uses the tree node schema grammar to describe the form of a decorated syntax tree,
which contains semantic nodes produced by the [decoration attribute grammar](#decoration).

The tree node schema grammar looks very similar to a context-free grammar,
and indeed uses the same syntactic structures. However, there are important differences.

In the tree node schema grammar,
a production such as `Parent ::= Child1 Child2;` indicates that a parent node of type `Parent` must contain
two children, of types `Child1` and `Child2` respectively, in that order.
This is to be interpreted literally: the parent must be an actual object that contains two child objects.
In a CFG, the nonterminals `Parent`, `Child1`, and `Child2` may be *represented* by concrete nodes
in a parse tree, but this representation serves only as an aide in syntactic analysis, and is not mandatory.
Whereas, the tree node schema grammar makes this a requirement by specifying the form of such nodes.
The parent must not be replaced by its children as it would in a CFG, because the parent
might contain information (in the form of node attributes), which cannot be lost.

Secondly, the tree node schema grammar adds the ability to describe **node attributes**,
which is not within the capability of CFGs.
A production `Parent[attr: ValueType] ::= Child+;` indicates that a node of type `Parent`,
if it has an attribute named `attr` and the value of that attribute is of type `ValueType`,
must have one or more children of type `Child`. It is possible for other nodes of type `Parent`
to contain a different set of children. In a CFG, there can be only one production describing `Parent`,
with any alternate choices having equal weight.

A third major difference is that there is no distinguishing between terminals and nonterminals
in the tree node schema grammar. Everything is a nonterminal, but it is just that some nodes
may be specified with zero children (in which case they are called “empty”).
Such a node would be described by the production `EmptyNode ::= ();`.
(In fact, because trees are finite, every branch must end with an empty node.)
It is possible for a node type to be either empty or nonempty (thus serving as either a nonterminal or terminal).
E.g., `MaybeEmptyNode ::= Child*;`.

Lastly, the tree node schema grammar makes use of an abstraction production, which is shorthand for
an alternation of several types. The production `Alias =:= Node1 | Node2;` indicates that the term
`Alias` can be use in place of any instance of `Node 1 | Node2` in the grammar.
Note that this does *not* mean that there is a node of type `Alias`, which must have one child,
which is of type either `Node1` or `Node2`. Rather, `Alias` is only a shorthand for
the type union `Node 1 | Node2`.
The distinction is made by the definition symbol `=:=` instead of the usual `::=`.

For example, the following grammar describes the form of a `SemanticTemplate` node:
If it has the attribute `[type="full"]`, then it must contain only a `SemanticConstant` node;
if it has the attribute `[type="substitution"]`, then it must contain one or more groups of
a `SemanticConstant` followed by an optional `SemanticExpression`, and must end with a final `SemanticConstant`.
```
SemanticTemplate[type: "full"]
	::= SemanticConstant;
SemanticTemplate[type: "substitution"]
	::= (SemanticConstant SemanticExpression?)+ SemanticConstant;
```
Note that the above grammar is not an unambiguous context-free grammar,
since it cannot yield a unique parse tree.
(Think of the sequence `SemanticConstant SemanticConstant SemanticConstant`.)


### Notation: Tree Node Schema Grammar
Notation for the TNSG is almost exactly the same as that of [CFGs](#notation-context-free-grammar),
with exceptions described above.

#### Formal Grammar (TNSG)
The grammar below (which is a CFG) describes the formal Tree Node Schema Grammar
that describes the Counterpoint Programming Language.
```
TypeUnit ::=
	| NUMBER
	| STRING
	| IDENTIFIER ("<" Type ">")?
	| "(" Type ")"
;

Type
	::= (Type "|")? TypeUnit;

Attribute
	::= "[" IDENTIFIER ":" Type "]";

Nonterminal
	::= IDENTIFIER Attribute*;

Unit ::=
	| Nonterminal
	| "(" Choice ")"
;

Item
	::= Unit ("+" | "*")? "?"?;

Sequence ::= (Sequence "&")? Item+;
Choice   ::= (Choice   "|")? Sequence;

Production ::=
	| Nonterminal "::=" ("&" | "|")? Choice ("&" | "|")? ";"
	| IDENTIFIER  "=:=" ("&" | "|")? Choice ("&" | "|")? ";"
;

Grammar
	::= #x02 Production* #x03;
```



## Attribute Grammars
Attribute grammars are context-sensitive grammars that help the decorator transform
the parse tree into the semantic tree, which is a prerequisite for semantic analysis.
In an attribute grammar, attributes are defined on nodes of a parse tree via the productions
of a context-free grammar.
In this specification, attributes are “synthesized” and thus propagate in a bottom-up manner:
given a parse node, computing an attribute of that node might require looking at its children.
Attributes are always [normal completion structures](/.data-types.md#completionstructure).
For notational convenience, only the value of the completion structure is written.


### Example
```
Quantity(INT :::= [0-9]) -> Integer
	:= Quantity([0-9]);
Quantity(INT :::= INT [0-9]) -> Integer
	:= 10 * Quantity(INT) + Quantity([0-9]);
Quantity([0-9] :::= "0") -> Integer := 0;
Quantity([0-9] :::= "1") -> Integer := 1;
...
Quantity([0-9] :::= "9") -> Integer := 9;
```
This example illustrates a hypothetical attribute grammar that defines an attribute
called `Quantity` on an `INT` token.
The attributes themselves are [completion structures](./data-types.md#completionstructure)
whose \`type\` properties are *normal* and whose \`value\` properties are of type `Integer`.
Each rule defines the attribute on the token matching a different pattern defined by a CFG,
and then denotes that the returned object will be an integer.
The first line could be read aloud as,
“The `Quantity` of `INT` matching `[0-9]` is the `Quantity` of `[0-9]`.”


### Token Worth
The token worth grammar is an attribute grammar that determines the semantic value of the various token types.
It assigns a [Counterpoint Specification Value](./data-types.md#counterpoint-specification-types)
to a Token produced by the Tokenizer piece of the Counterpoint compiler.
This grammar is described further in detail in the chapter
[Counterpoint Programming Language: Lexicon](./language-lexicon.md).


### Decoration
The decoration grammar is the attribute grammar that defines the semantic value
of a syntactic production. The values of the productions in the decoration attribute grammar
are semantic nodes whose properties and children determine what code is to be generated by the compiler.
These semantics are called “static semantics” because they are performed
after syntactic analysis, but before the program is executed at run-time.

The productions of the decoration grammar are listed in the chapters
[Counterpoint Programming Language: Expressions](./language-expressions.md),
[Counterpoint Programming Language: Statements](./language-statements.md), and
[Counterpoint Programming Language: Goal Symbols](./language-goal.md).


### Notation: Attribute Grammar
The notation for the attribute grammars (AGs) in this specification resembles that of the
[context-free grammars](#notation-context-free-grammar), with a few changes.

Attribute productions are written in lambda form, taking a lexical or syntactic production
as an argument and “returning” a value.
(To be precise, the AG production defines a value as the attribute
of the specified lexical/syntactic production.)
The “return type” of the attribute production is indicated after a thin arrow `->`
following the attribute production name, and the “return value” is
a [Counterpoint Specification Value](./data-types.md#counterpoint-specification-types) followed by the definition symbol `:=`.
```
‹AttributeName›(‹CFGProduction›) -> ‹ReturnType›
	:= ‹ReturnValue›;
```
For brevity, we may use the format
```
‹AttributeName›(‹CFGProduction›) -> ‹ReturnType› := ‹ReturnValue›;
```

The production definition following the symbol `:=` is not a sequence of terminals and nonterminals,
but rather a semantic value.
Since different AGs can “return” different types, the “return type” is indicated after the production head.

An AG production may define several forms of a CFG production as its parameter:
```
Decorate(StringTemplate ::= TEMPLATE_FULL) -> SemanticTemplate
	:= (SemanticTemplate[type="full"]
		(SemanticConstant[value=TokenWorth(TEMPLATE_FULL)])
	);
Decorate(StringTemplate ::= TEMPLATE_HEAD TEMPLATE_TAIL) -> SemanticTemplate
	:= (SemanticTemplate[type="substitution"]
		(SemanticConstant[value=TokenWorth(TEMPLATE_HEAD)])
		(SemanticConstant[value=TokenWorth(TEMPLATE_TAIL)])
	);
```
The AG example above defines a Decoration attribute on `StringTemplate` productions.
If the production matches `TEMPLATE_FULL`, then one value is returned;
if it matches `TEMPLATE_HEAD TEMPLATE_TAIL` than another value is returned.

The terminals and nonterminals in the parameter’s sequence act like separate parameters,
which can then be referenced in the return value.

AG productions may also invoke each other, and they may do so recursively.
```
TokenWorth(TemplateFull :::= #x22 #x22 #x22 TemplateChars__EndDelim #x22 #x22 #x22) -> Sequence<RealNumber>
	:= TokenWorth(TemplateChars__EndDelim)
TokenWorth(TemplateChars__EndDelim :::= [^"{#x03]) -> Sequence<RealNumber>
	:= [UTF8Encoding(CodePoint([^"{#x03]))]
TokenWorth(TemplateChars__EndDelim :::= [^"{#x03] TemplateChars__EndDelim) -> Sequence<RealNumber>
	:= [UTF8Encoding(CodePoint([^"{#x03])), ...TokenWorth(TemplateChars__EndDelim)]
TokenWorth(TemplateChars__EndDelim :::= TemplateChars__EndDelim__StartDelim) -> Sequence<RealNumber>
	:= TokenWorth(TemplateChars__EndDelim__StartDelim)
TokenWorth(TemplateChars__EndDelim :::= TemplateChars__EndDelim__StartInterp) -> Sequence<RealNumber>
	:= TokenWorth(TemplateChars__EndDelim__StartInterp)
```
The TokenWorth attribute is computed by invoking itself on children elements.

Other than its functional behavior, the attribute grammar is much simpler
than its context-free counterpart. There are no operations or expansions.
The complexity lies within the values the productions return, which are further described
in the chapter [Data Types and Values](./data-types.md).

#### Formal Grammar (AG)
The grammar below (which is a CFG) describes the formal AGs that describe the Counterpoint Programming Language.
```
Item ::=
	| STRING
	| CHARCODE
	| CHARCLASS
	| IDENTIFIER
;

Type
	::= IDENTIFIER ("<" Type ">")?;

Parameter
	::= IDENTIFIER (":::=" | "::=") Item+;

ReturnType
	::= (ReturnType "|")? Type;

Production
	::= IDENTIFIER "(" Parameter ")" "->" ReturnType ":=" RETURN_VALUE ";";

Grammar
	::= #x02 Production* #x03;
```
where the non-literal terminal symbols of the syntax grammar above are
taken from the lexical grammar defined in [CFGs: Formal Grammar](#formal-grammar-cfg).
The exception is the terminal `RETURN_VALUE`, which has no prescribed syntax.
The syntax of the return value is the syntax of its type.



## Algorithms
This specification uses abstract algorithms to describe the behavior of the compiler and virtual machine.
The algorithms are called “abstract” since they do not specify an implementation technique or technology,
and their steps are written in prose.

An algorithm consists of a name, an output type, zero or more parameters, and a sequence of steps.
The steps are formatted as an ordered list;
the list is *ordered* in that the outcome could change if the steps were not performed in the order given.

An algorithm must always output a [CompletionStructure](/.data-types.md#completionstructure) object,
which is returned by the algorithm to its invoker.
The completion structure might or might not have a \`value\`.

The output type of an algorithm is the type of the \`value\` (if it exists) of
a returned normal completion structure, and it is specified before
the name of the algorithm in its header.
If an algorithm outputs a normal completion structure without a \`value\`,
the output type is specified as [None](./data-types.md#none).

If an algorithm outputs an *abrupt* completion structure, its \`value\`, if it exists,
though it is still included in the returned structure, is *not* indicated in the output type,
however, an exclamation point `!` is appended to the return type.
For example, an algorithm with return type `Boolean!` will return a normal completion with
a \`value\` of type `Boolean`, or an abrupt completion.

Algorithm steps may include substeps, which are formatted by an additional indentation level.
Substeps may include their own “subsubsteps”, and so on, with each level corresponding to a new indentation.
Steps may be nested an arbitrary number of levels.


### Algorithm Steps
The steps allowed in an algorithm fall into categories, whose semantics are defined here.
If a step does not match one of the given categories, its behavior is open to interpretation.

#### Assert
Steps that begin with «*Assert:* …» are informative and are meant only to provide clarification to the reader.
These steps explicitly indicate that a conditon is true when it would otherwise only be implicit.
Making an assertion only provides information to the reader and does not add any functionality.
If the intent is to exit abruptly, then a comination of
[If](#if-else-while) and [Throw](#throw) steps should be used.

#### Note
Steps that begin with «*Note:* …» are informative notes to the reader. They have no effect on the algorithm.

#### Perform
Steps that begin with «*Perform:* …» invoke another algorithm and expect it to be performed.
The current algorithm is halted on this step and waits for the invoked algorithm to complete before proceeding.

#### Let/Set
Algorithms may make the use of variable references, such as, «*Let* \`x\` be \`someValue\`.»
Such a step indicates that \`x\` is a pointer to the value \`someValue\`, which itself may be any value.

The variable \`x\` is treated as a pointer in that if \`someValue\` is mutated in some way,
then that effect will also be seen on \`x\`.
An algorithm may specify that a variable be reassigned, e.g., «*Set* \`x\` to \`someOtherValue\`.»
In that case, the pointer \`x\` is changed to the new value.

#### If/Else, While
Conditional and loop programming structures may appear in algorithms.
For conditionals, the ‘if branch’ and ‘else branch’ are parallel steps,
each containing the substeps respective to that branch.
(The ‘else branch’ is not always necessary, e.g. if the ‘if branch’ completes the algorithm.)
‘If’ steps begin with «*If* …:» and ‘else’ steps begin with «*Else:*».

A step that specifies a loop must have as its substeps the steps to be performed for each iteration.
A loop step begins with «*While* …:».

#### Continue
A step within the substeps of a loop may direct the algorithm to **continue**,
which is to say the rest of the substeps within the current iteration should be skipped,
and the loop should proceed to the next iteration.
Such a step says «*Continue.*».

#### Break
A step within the substeps of a loop may direct the algorithm to **break**,
which is to say the rest of the loop should be skipped,
and the algorithm should proceed to the next step after the loop, if that step exists.
If that next step does not exist, the algorithm should complete.
Such a step says «*Break.*».

A step that begins with «*Break:* …» may contain a positive integer, which indicates
the number of nested loops to terminate. For example, if such a step is nested within 2 loops,
then «*Break:* 1.» would indicate that only the inner loop be terminated, but that the algorithm
continue with the outer loop. «*Break:* 2.» would indicate both loops terminate.
A step that says «*Break.*» (with no number) implies «*Break:* 1.».

#### Return
An algorithm step that reads «*Return:* ‹v›.» (where ‹v› is a metavariable representing a completion value)
is shorthand for «*Return:* [type= normal, value= ‹v›].», meaning
the algorithm outputs a normal completion structure with a \`value\` of ‹v›.

However, an algorithm step that reads «*Return:* [type= ‹type›, value= ‹v›].» is to be interpreted as-is,
as returning the completion structure itself, not “wrapped” in a new normal completion.
Similarly, an algorithm step that reads «*Return:* ‹CS›.»,
where ‹CS› represents an actual CompletionStructure object (such as the result of an algorithm call),
is also to be interpreted as-is, as returning the completion structure itself.

An algorithm step that reads «*Return*.» is shorthand for «*Return:* [type= normal].», that is,
it outputs a normal completion structure without a \`value\` (thus the output type is None).

An algorithm with no Return statement is implied to return a normal completion with no value.

#### Throw
When an algorithm step reads «*Throw:* ‹v›.» (where ‹v› is a metavariable representing a completion value),
a throw completion structure whose \`value\` is ‹v› is returned.
That is, the step is shorthand for «*Return:* [type= throw, value= ‹v›].».
Note that such a completion structure is “abrupt”.

An algorithm step that reads «*Throw:* [type= ‹type›, value= ‹v›].» is to be interpreted
as «*Return:* [type= throw, value= ‹v›]», not the original completion “wrapped” in a new *throw* completion.
Similarly, an algorithm step that reads «*Throw:* ‹CS›.»,
where ‹CS› represents an actual CompletionStructure object (such as the result of an algorithm call),
is also to be interpreted in the same manner, as returning a *throw* completion structure
whose value is the value of ‹CS›.

#### Unwrap
An algorithm step that contains «*Unwrap:* ‹s›» (where ‹s› is a completion structure or algorithm call)
returns ‹s› if it is an abrupt completion, but otherwise replaces ‹s› with its value.
The step is shorthand for the following steps:
```
1. *If* ‹s› is an abrupt completion:
	1. *Return:* ‹s›.
2. *Assert:* ‹s› is a normal completion.
3. *If* ‹s› has a `value` property:
	1. Perform the step in which «*Unwrap:*» appeared, replacing ‹s› with `‹s›.value`.
4. *Else:*
	1. Perform the step in which «*Unwrap:*» appeared, replacing ‹s› with `none`.
```

For example, setting a variable to an unwrap step …
```
1. *Let* `call` be the result of performing `AlgorithmCall()`.
2. *Let* `v` be *Unwrap:* `call`.
```
… is shorthand for returning if abrupt.
```
1. *Let* `call` be the result of performing `AlgorithmCall()`.
2. *If* `call` is an abrupt completion:
	1. *Return:* `call`.
3. *Assert:* `call` is a normal completion.
4. *If* `call` has a `value` property:
	1. *Let* `v` be `call.value`.
5. *Else:*
	1. *Let* `v` be `none`.
```

#### UnwrapAffirm
An algorithm step that contains «*UnwrapAffirm:* ‹s›» (where ‹s› is a completion structure or algorithm call)
assumes ‹s› is a normal completion and replaces ‹s› with its value.
The step is shorthand for the following steps:
```
1. *Assert:* ‹s› is a normal completion.
2. *If* ‹s› has a `value` property:
	1. Perform the step in which «*UnwrapAffirm:*» appeared, replacing ‹s› with `‹s›.value`.
3. *Else:*
	1. Perform the step in which «*UnwrapAffirm:*» appeared, replacing ‹s› with `none`.
```

For example, setting a variable to an unwrap-affirm step …
```
1. *Let* `call` be the result of performing `AlgorithmCall()`.
2. *Let* `v` be *UnwrapAffirm:* `call`.
```
… is shorthand for asserting it is not abrupt.
```
1. *Let* `call` be the result of performing `AlgorithmCall()`.
2. *Assert:* `call` is a normal completion.
3. *If* `call` has a `value` property:
	1. *Let* `v` be `call.value`.
4. *Else:*
	1. *Let* `v` be `none`.
```

#### Shorthand Notation
Algorithm steps may contain shorthand notation that desugar to the types of steps listed above.
The metavariables ‹x›, ‹y›, ‹A›, ‹B›, and ‹C› represent any snippets of algorithm prose.

##### Else If
A step that begins with «*Else If* …:» desugars to an ‘else’ step with an ‘if’ substep.
```
1. *If* ‹x›:
	1. ‹A›.
2. *Else If* ‹y›:
	1. ‹B›.
3. *Else*:
	1. ‹C›.
```
is shorthand for
```
1. *If* ‹x›:
	1. ‹A›.
2. *Else*:
	1. *If* ‹y›:
		1. ‹B›.
	2. *Else*:
		1. ‹C›.
```

##### If And
A step that begins with «*If* … *and* …:» desugars to an ‘if’ step with an ‘if’ substep.
```
1. *If* ‹x› *and* ‹y›:
	1. ‹A›.
2. *Else*:
	1. ‹B›.
```
is shorthand for
```
1. *If* ‹x›:
	1. *If* ‹y›:
		1. ‹A›.
	2. *Else*:
		1. ‹B›.
2. *Else*:
	1. ‹B›.
```

##### If Or
A step that begins with «*If* … *or* …:» desugars to two ‘if’ steps with the same substeps.
```
1. *If* ‹x› *or* ‹y›:
	1. ‹A›.
2. *Else*:
	1. ‹B›.
```
is shorthand for
```
1. *If* ‹x›:
	1. ‹A›.
2. *Else If* ‹y›:
	1. ‹A›.
3. *Else*:
	1. ‹B›.
```

##### For
A step that reads «*For index* ‹i› in ‹s›:» (where ‹i› is a variable and ‹s› is a sequence)
is shorthand for the following steps:
```
1. *Let* `‹i›` be 0.
2. *While* `‹i›` is less than `‹s›.count`:
	1. Perform the substeps listed under the *For index* step.
	2. Increment `‹i›`.
```

A step that reads «*For key* ‹k› in ‹s›:» (where ‹k› is a variable and ‹s› is a structure)
is shorthand for the following steps:
```
1. *Let* `i` be 0.
2. *While* `i` is less than `‹s›.count`:
	1. *Let* `‹k›` be some key in `‹s›` that hasn’t yet been assigned over the course of this loop.
	2. Perform the substeps listed under the *For key* step.
	3. Increment `i`.
```
Note that this algorithm does not require the keys in ‹s› to be iterated over in any particular order.

A step that reads «*For each* ‹it› in ‹s›:» (where ‹it› is a variable and ‹s› is a sequence)
is shorthand for the following steps:
```
1. *For index* `i` in `‹s›`:
	1. Perform the substeps listed under the *For each* step, replacing `‹it›` with `‹s›[i]`.
```

A step that reads «*For each* ‹val› in ‹s›:» (where ‹val› is a variable and ‹s› is a structure)
is shorthand for the following steps:
```
1. *For key* `k` in `‹s›`:
	1. Perform the substeps listed under the *For each* step, replacing `‹val›` with `‹s›[k]`.
```

##### Spread
An algorithm step that contains «...‹s›» (where ‹s› is a sequence)
is shorthand for the following steps:
```
1. *For each* `it` in ‹s›:
	1. Perform the step in which «...» appeared, replacing `...‹s›` with `it`.
```

##### Mappings
A step that contains «a mapping of ‹s› indexed by ‹i› to ‹e›» is shorthand for a *For* loop
that populates a new sequence, where ‹s› is a starting sequence, ‹i› is an index variable,
and ‹e› is an expression possibly containing ‹s› and ‹i›.
The new sequence is the result of mapping each item in the starting sequence to
a value prescribed by the expression ‹e›.

(In the example below, assume `sequence` is a sequence of RealNumber values.)
```
1. *Let* `result` be a mapping of `sequence` indexed by `i` to `sequence[i] + 1`.
```
is shorthand for
```
1. *Let* `result` be an empty sequence.
2. *For index* `i` in `sequence`:
	1. Push `sequence[i] + 1` to `result`.
```

A step that contains «a mapping of ‹s› for each ‹it› to ‹e›» is shorthand for an indexed mapping,
replacing the *For index* step with a *For each* step.
```
1. *Let* `result` be a mapping of `sequence` for each `it` to `it + 1`.
```
is shorthand for
```
1. *Let* `result` be an empty sequence.
2. *For each* `it` in `sequence`:
	1. Push `it + 1` to `result`.
```

##### Flattened Mappings
A step that contains «a flattened mapping of ‹s› indexed by ‹i› to ‹e›» is similar to a [Mapping](#mappings) step,
except that the expression ‹e› must be a sequence, and the resulting sequence,
rather than being a sequence of sequences, is instead a sequence of values perscribed by items of ‹e›.

(In the example below, assume `sequence` is a sequence of RealNumber values.)
```
1. *Let* `result` be a flattened mapping of `sequence` indexed by `i` to `[sequence[i], sequence[i] + 1]`.
```
is shorthand for
```
1. *Let* `map` be a mapping of `sequence` indexed by `i` to `[sequence[i], sequence[i] + 1]`.
2. *Let* `result` be an empty sequence.
3. *For index* `i` in `map`:
	1. Push `...map` to `result`.
```

A step that contains «a flattened mapping of ‹s› for each ‹it› to ‹e›» is like an indexed mapping
except instead of indices the mapping iterates over sequence items.
```
1. *Let* `result` be a flattened mapping of `sequence` for each `it` to `[it, it + 1]`.
```
is shorthand for
```
1. *Let* `map` be a mapping of `sequence` for each `it` to `[it, it + 1]`.
2. *Let* `result` be an empty sequence.
3. *For index* `i` in `map`:
	1. Push `...map` to `result`.
```

##### Filterings
A step that contains «a filtering of ‹s› indexed by ‹i› such that ‹e›» is shorthand for a *For* loop
that populates a new sequence, where ‹s› is a starting sequence, ‹i› is an index variable,
and ‹e› is a predicate, possibly containing ‹s› and ‹i›, to be satisfied.
The new sequence is the result of finding only the items in the starting sequence
that satisfy the predicate ‹e›.

(In the example below, assume `sequence` is a sequence of RealNumber values.)
```
1. *Let* `result1` be a filtering of `sequence` indexed by `i` such that `sequence[i] > 0`.
1. *Let* `result2` be a filtering of `sequence` indexed by `i` such that `sequence[i]` is even.
```
is shorthand for
```
1. *Let* `result1` be an empty sequence.
2. *For index* `i` in `sequence`:
	1. *If* `sequence[i] > 0`:
		1. Push `sequence[i]` to `result1`.
3. *Let* `result2` be an empty sequence.
4. *For index* `i` in `sequence`:
	1. *If* `sequence[i]` is even:
		1. Push `sequence[i]` to `result2`.
```

A step that contains «a filtering of ‹s› for each ‹it› such that ‹e›» is shorthand for an indexed filtering,
replacing the *For index* step with a *For each* step.
```
1. *Let* `result1` be a filering of `sequence` for each `it` such that `it > 0`.
2. *Let* `result2` be a filering of `sequence` for each `it` such that `it` is an integer.
```
is shorthand for
```
1. *Let* `result1` be an empty sequence.
2. *For each* `it` in `sequence`:
	1. *If* `it > 0` is `true`:
		1. Push `it` to `result1`.
3. *Let* `result2` be an empty sequence.
4. *For each* `it` in `sequence`:
	1. *If* `it` is an integer:
		1. Push `it` to `result2`.
```

##### Reductions
A step that contains «a reduction of ‹s› with ‹accum› for each ‹it› to ‹e› starting with ‹p›» is shorthand for
a *For* loop that updates a result; where ‹s› is a starting sequence; ‹accum› is an accumulator value; ‹it› is an item in ‹s›;
‹e› is an expression possibly containing ‹s›, ‹accum›, and ‹it›; and ‹p› is the initial value of ‹accum›.
The updated result is the result of setting ‹accum› to the evaluation of ‹e›, for each ‹it› in ‹s›.

(In the example below, assume `sequence` is a sequence of Structures with a \`prop\` property.)
```
1. *Let* `result` be a reduction of `sequence` with `accum` for each `it` to `[...accum, it.prop]` starting with `[]`.
```
is shorthand for
```
1. *Let* `result` be `[]`.
2. *For each* `it` in `sequence`:
	1. *Set* `result` to `[...result, it.prop]`.
```

A step that contains «a reduction of ‹s› for each ‹a› and ‹b› to ‹e›» assumes the sequence is nonempty,
uses ‹a› as the accumulator value, ‹b› as the iterated item in ‹s›, and the item at index 0 in ‹s› as the initial value.
It skips the first iteration.

(In the example below, assume `sequence` is a sequence of RealNumber values.)
```
1. *Let* `result` be a reduction of `sequence` for each `a` and `b` to `a + b`.
```
is shorthand for
```
1. *Assert*: `sequence` is not empty.
2. *Let* `result` be a reduction of `sequence[1 ..]` with `accum` for each `it` to `accum + it` starting with `sequence.0`.
```


### Runtime Instructions
Algorithms that specify behavior to be performed at runtime are called **runtime instructions**.
These algorithms are derived from the [static semantics](#decoration) of a program.
They pass instructions to the code generator,
which in turn generates compiled code to be executed at runtime.

The runtime instructions of static semantics are listed in the chapters
[Counterpoint Programming Language: Expressions](./language-expressions.md),
[Counterpoint Programming Language: Statements](./language-statements.md), and
[Counterpoint Programming Language: Goal Symbols](./language-goal.md).


### Notation: Algorithms
Algorithms are written in parameterized functional form, e.g.,
```
RType AlgorithmName(PType1 param1, PType2 param2) :=
```
where `AlgorithmName` is the algorithm name, `RType` is the output type of the algorithm,
and `PType1` and `PType2` are the types of the parameters `param1` and `param2` respectively.
If the algorithm is invoked in another algorithm, it is written in a similar manner,
e.g., `AlgorithmName(arg1, arg2)`.

The symbol `:=` delimits the algorithm head from its body (its steps).
Typically, algorithm names are written in PascalCase while parameter/argument names are written in snake_case.

Within the steps of an algorithm, referenced local variables, parameters, other algorithm names, and code snippets
are delimited with \`back-ticks\`.

Algorithm instructions (*If*, *Perform*, etc.) are written in *italics*.

```
None AlgorithmName(RealNumber param) :=
	1. Step 1.
	2. Step 2.
		1. Substep 2.1.
			1. Subsubstep 2.1.1.
		2. Substep 2.2.
	3. Step 3.
		1. Substep 3.1.
```
