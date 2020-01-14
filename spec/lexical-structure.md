# Lexical Structure

This chapter defines the lexical structure of the Solid programming language.



## Solid Source Code
Solid source text (Solid code) is expressed using [Unicode](https://www.unicode.org/).
Solid source text is a sequence of Unicode code points,
values ranging from U+0000 to U+10FFFF (including surrogate code points).
Not all code points are permitted everywhere;
the token syntax below explicitly define these permissions.

When stored and transmitted, Solid source text should be encoded and decoded via the
[UTF-8](https://tools.ietf.org/html/rfc3629) encoding format.

Solid programs are often stored in text files, which, for editing convenience, are organized into lines.
These lines are typically separated by some combination of the characters
**U+000D CARRIAGE RETURN (CR)** and **U+000A LINE FEED (LF)**.
For example, it is common for Windows systems to represent a newline as a CR–LF pair,
whereas on Unix-based systems the representation is a single LF.

To simplify the tasks of external applications, the Solid compiler **normalizes** all line breaks
in a source file on input, before parsing. This normalization is a process in which
both the two-character sequence CR–LF and any single CR that is not followed by a LF
are replaced with a single LF character.

Even though Solid is a [whitespace-independent language](#whitespace),
line break normalization is important to the compilation process,
during which line and column numbers of any invalid source input might be reported.



## Token Syntax
After line break normalization,
the source text of a Solid file is converted into a sequence of input elements, called tokens.
The source text is scanned from left to right, repeatedly taking the longest possible
sequence of code points as the next token.
The lexical structure of Solid describes what sequence of characters form valid tokens,
which form the lowest-level building blocks of the language.

There are a small number of token types, each of which have a specific purpose.

1. [File Bounds](#file-bounds)
1. [Whitespace](#whitespace)
1. [Numbers](#numbers)
1. [Punctuators](#punctuators)


### File Bounds
```w3c
FileBound ::= #x02 | #x03
```
File bound tokens are tokens that consist of exactly 1 character:
either **U+0002 START OF TEXT** (“STX”), or **U+0003 END OF TEXT** (“ETX”).
The STX character appears at the beginning of the source input, and the ETX character appears at the end.
These tokens are passed to the parser to help it determine where the bounds of a file are.


### Whitespace
```w3c
Whitespace ::= Whitespace? (#x20 | #x09 | #x0A)
```
Whitespace tokens consist of combinations of the following characters.
Any consecutive sequence of these characters is put into a single whitespace token.

- U+0020 SPACE
- U+0009 CHARACTER TABULATION
- U+000A LINE FEED (LF)

Solid is whitespace-independent.
This means that a programmer should be able to add more whitespace where whitespace already exists,
and remove any amount of whitespace from existing whitespace (but not remove all of it)
without affecting the syntax or semantics of the program.
Whitespace tokens are not sent to the parser for syntactic analysis.

The Solid compiler does not currently, but could in the future, recognize the following whitespace characters:

- U+000B LINE TABULATION
- U+000C FORM FEED (FF)
- U+000D CARRIAGE RETURN (CR)
- U+00A0 NO-BREAK SPACE
- U+1680 OGHAM SPACE MARK
- U+2000 EN QUAD
- U+2001 EM QUAD
- U+2002 EN SPACE
- U+2003 EM SPACE
- U+2004 THREE-PER-EM SPACE
- U+2005 FOUR-PER-EM SPACE
- U+2006 SIX-PER-EM SPACE
- U+2007 FIGURE SPACE
- U+2008 PUNCTUATION SPACE
- U+2009 THIN SPACE
- U+200A HAIR SPACE
- U+200B ZERO WIDTH SPACE
- U+2028 LINE SEPARATOR
- U+2029 PARAGRAPH SEPARATOR
- U+202F NARROW NO-BREAK SPACE
- U+205F MEDIUM MATHEMATICAL SPACE
- U+3000 IDEOGRAPHIC SPACE
- U+FEFF ZERO WIDTH NO-BREAK SPACE


### Numbers
```w3c
Number ::= ("+" | "-")? IntegerLiteral

IntegerLiteral ::=
	DigitSequenceDec

DigitSequenceDec ::= DigitSequenceDec? [0-9]
```
Numbers are literal constants that represent numeric mathematical values.
Currently, only positive and negative (and zero) integers are supported.

#### Static Semantics: Mathematical Value
The Mathematical Value (MV) of a number token is the computed number that the token represents.

There is a many-to-one relationship between tokens and mathematical values. For example,
a token containing `0042` has the same mathematical value as a token containing `+42`:
the integer *42*.

```w3c
MV(Number ::= IntegerLiteral)
	:= MV(IntegerLiteral)
MV(Number ::= "+" IntegerLiteral)
	:= MV(IntegerLiteral)
MV(Number ::= "-" IntegerLiteral)
	:= -1 * MV(IntegerLiteral)
MV(IntegerLiteral ::= DigitSequenceDec)
	:= MV(DigitSequenceDec)
MV(DigitSequenceDec ::= [0-9])
	:= MV([0-9])
MV(DigitSequenceDec ::= DigitSequenceDec [0-9])
	:= 10 * MV(DigitSequenceDec) + MV([0-9])
MV([0-9] ::= "0") := 0
MV([0-9] ::= "1") := 1
MV([0-9] ::= "2") := 2
MV([0-9] ::= "3") := 3
MV([0-9] ::= "4") := 4
MV([0-9] ::= "5") := 5
MV([0-9] ::= "6") := 6
MV([0-9] ::= "7") := 7
MV([0-9] ::= "8") := 8
MV([0-9] ::= "9") := 9
```

#### Static Semantics: Decoration (Numbers)
```w3c
Decorate(Number)
	::= SemanticConstant {value: MV(Number)} []
```
where `MV` is [Mathematical Value](./#static-semantics-mathematical-value).


### Punctuators
```w3c
Punctuator ::= "+" | "-" | "*" | "/" | "^" | "(" | ")"
```
Punctuators are non-alphanumeric characters in the ASCII character set that
add to the semantics of the Solid language.
Some punctuators are operators, which perform computations on values, and
some punctuators are delimiters, which separate certain code constructs from each other or group them together.
