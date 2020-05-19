# Solid Language: Lexicon
This chapter defines the lexical composition of the Solid programming language.



## Solid Source Code
Solid source text (Solid code) is expressed using characters from the
[Unicode](https://www.unicode.org/) character set.
Solid source text is a sequence of Unicode code points,
values ranging from U+0000 to U+10FFFF (including surrogate code points).
Not all code points are permitted everywhere;
the next section explicitly defines these permissions.

When stored and transmitted, Solid source text should be encoded and decoded via the
[UTF-8](https://tools.ietf.org/html/rfc3629) encoding format.

Solid programs are often stored in text files, which, for editing convenience, are organized into lines.
These lines are typically separated by some combination of the characters
**U+000D CARRIAGE RETURN (CR)** and **U+000A LINE FEED (LF)**.
For example, it is common for Windows systems to represent a newline as a CR–LF pair,
whereas on Unix-based systems the representation is a single LF.


### Line Normalization
To simplify the tasks of external applications and to delineate file bounds,
the Solid compiler **normalizes** all line breaks in a source file on input, before parsing.
This line normalization consists of three steps:

1. Prepend the file with a **U+0002 START OF TEXT** (“SOT”) character followed by an LF.
2. Replace any two-character sequence CR–LF and any single CR not followed by an LF
	with a single LF character.
3. Append the file with an LF followed by a **U+0003 END OF TEXT** (“EOT”) character.

Note that if the source file already contains an LF at the end,
the last step will result in an extra LF character preceding the EOT.
This does not matter, however, since additional whitespace does not affect parsing.
Even though Solid is a [whitespace-independent language](#whitespace),
line break normalization is important to the compilation process,
during which line and column numbers of any invalid source input might be reported.



## Token Formation
After line break normalization,
the source text of a Solid file is converted into a sequence of input elements, called tokens.
The source text is scanned from left to right, repeatedly taking the longest possible
sequence of code points as the next token.
The lexical structure of Solid describes what sequence of characters form valid tokens,
which form the lowest-level building blocks of the language.

There are a small number of token types, each of which have a specific purpose.

```w3c
Goal ::=
	FileBound      |
	Whitespace     |
	Punctuator     |
	Number         |
	Word           |
	String         |
	TemplateFull   |
	TemplateHead   |
	TemplateMiddle |
	TemplateTail   |
	Comment        |
```

1. [File Bounds](#file-bounds)
1. [Whitespace](#whitespace)
1. [Punctuators](#punctuators)
1. [Numbers](#numbers)
1. [Keywords](#keywords)
1. [Identifiers](#identifiers)
1. [String Literals](#string-literals)
1. [Template Literals](#template-literals)
1. [Comments](#comments)


### File Bounds
```w3c
FileBound ::= #x02 | #x03
```
File bound tokens are tokens that consist of exactly 1 character:
either **U+0002 START OF TEXT**, or **U+0003 END OF TEXT**.


### Whitespace
```w3c
Whitespace ::= Whitespace? (#x20 | #x09 | #x0A)
```
Whitespace tokens consist of combinations of the following characters.
Any consecutive sequence of these characters is put into a single whitespace token.

Code Point | Name                 | Block       | Category
---------- | -------------------- | ----------- | ---------------------
U+0020     | SPACE                | Basic Latin | Separator, Space [Zs]
U+0009     | CHARACTER TABULATION | Basic Latin | Other, Control [Cc]
U+000A     | LINE FEED (LF)       | Basic Latin | Other, Control [Cc]

Solid is whitespace-independent.
This means that a programmer should be able to add more whitespace where whitespace already exists,
and remove any amount of whitespace from existing whitespace (but not remove all of it)
without affecting the syntax or semantics of the program.
Whitespace tokens are not sent to the parser for syntactic analysis.

The Solid lexical grammar does not currently recognize the following characters as whitespace:

Code Point | Name                      | Block                       | Category
---------- | ------------------------- | --------------------------- | -------------------------
U+000B     | LINE TABULATION           | Basic Latin                 | Other, Control [Cc]
U+000C     | FORM FEED (FF)            | Basic Latin                 | Other, Control [Cc]
U+000D     | CARRIAGE RETURN (CR)      | Basic Latin                 | Other, Control [Cc]
U+00A0     | NO-BREAK SPACE            | Latin-1 Supplement          | Separator, Space [Zs]
U+1680     | OGHAM SPACE MARK          | Latin-1 Supplement          | Separator, Space [Zs]
U+2000     | EN QUAD                   | Latin-1 Supplement          | Separator, Space [Zs]
U+2001     | EM QUAD                   | Latin-1 Supplement          | Separator, Space [Zs]
U+2002     | EN SPACE                  | Latin-1 Supplement          | Separator, Space [Zs]
U+2003     | EM SPACE                  | Latin-1 Supplement          | Separator, Space [Zs]
U+2004     | THREE-PER-EM SPACE        | Latin-1 Supplement          | Separator, Space [Zs]
U+2005     | FOUR-PER-EM SPACE         | Latin-1 Supplement          | Separator, Space [Zs]
U+2006     | SIX-PER-EM SPACE          | Latin-1 Supplement          | Separator, Space [Zs]
U+2007     | FIGURE SPACE              | Latin-1 Supplement          | Separator, Space [Zs]
U+2008     | PUNCTUATION SPACE         | Latin-1 Supplement          | Separator, Space [Zs]
U+2009     | THIN SPACE                | Latin-1 Supplement          | Separator, Space [Zs]
U+200A     | HAIR SPACE                | Latin-1 Supplement          | Separator, Space [Zs]
U+200B     | ZERO WIDTH SPACE          | General Punctuation         | Other, Format [Cf]
U+2028     | LINE SEPARATOR            | General Punctuation         | Separator, Line [Zl]
U+2029     | PARAGRAPH SEPARATOR       | General Punctuation         | Separator, Paragraph [Zp]
U+202F     | NARROW NO-BREAK SPACE     | General Punctuation         | Separator, Space [Zs]
U+205F     | MEDIUM MATHEMATICAL SPACE | General Punctuation         | Separator, Space [Zs]
U+3000     | IDEOGRAPHIC SPACE         | CJK Symbols and Punctuation | Separator, Space [Zs]


### Punctuators
```w3c
Punctuator ::= ";" | "=" | "+" | "-" | "*" | "/" | "^" | "(" | ")"
```
Punctuators are non-alphanumeric characters in the ASCII character set that
add to the semantics of the Solid language.
Some punctuators are operators, which perform computations on values, and
some punctuators are delimiters, which separate certain code constructs from each other or group them together.


### Numbers
```w3c
Number ::= ("+" | "-")? IntegerLiteral

IntegerLiteral ::=
	"\b"  DigitSequenceBin |
	"\q"  DigitSequenceQua |
	"\o"  DigitSequenceOct |
	"\d"? DigitSequenceDec |
	"\x"  DigitSequenceHex |
	"\z"  DigitSequenceHTD

DigitSequenceBin ::= (DigitSequenceBin "_"?)? [0-1]
DigitSequenceQua ::= (DigitSequenceQua "_"?)? [0-3]
DigitSequenceOct ::= (DigitSequenceOct "_"?)? [0-7]
DigitSequenceDec ::= (DigitSequenceDec "_"?)? [0-9]
DigitSequenceHex ::= (DigitSequenceHex "_"?)? [0-9a-f]
DigitSequenceHTD ::= (DigitSequenceHTD "_"?)? [0-9a-z]
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

MV(IntegerLiteral ::= "\b"  DigitSequenceBin)
	:= MV(DigitSequenceBin)
MV(IntegerLiteral ::= "\q"  DigitSequenceQua)
	:= MV(DigitSequenceQua)
MV(IntegerLiteral ::= "\o"  DigitSequenceOct)
	:= MV(DigitSequenceOct)
MV(IntegerLiteral ::= "\d"? DigitSequenceDec)
	:= MV(DigitSequenceDec)
MV(IntegerLiteral ::= "\x"  DigitSequenceHex)
	:= MV(DigitSequenceHex)
MV(IntegerLiteral ::= "\z"  DigitSequenceHTD)
	:= MV(DigitSequenceHTD)

MV(DigitSequenceBin ::= [0-1])
	:= MV([0-1])
MV(DigitSequenceBin ::= DigitSequenceBin "_"? [0-1])
	:= 2 * MV(DigitSequenceBin) + MV([0-1])
MV(DigitSequenceQua ::= [0-3])
	:= MV([0-3])
MV(DigitSequenceQua ::= DigitSequenceQua "_"? [0-3])
	:= 4 * MV(DigitSequenceQua) + MV([0-3])
MV(DigitSequenceOct ::= [0-7])
	:= MV([0-7])
MV(DigitSequenceOct ::= DigitSequenceOct "_"? [0-7])
	:= 8 * MV(DigitSequenceOct) + MV([0-7])
MV(DigitSequenceDec ::= [0-9])
	:= MV([0-9])
MV(DigitSequenceDec ::= DigitSequenceDec "_"? [0-9])
	:= 10 * MV(DigitSequenceDec) + MV([0-9])
MV(DigitSequenceHex ::= [0-9a-f])
	:= MV([0-9a-f])
MV(DigitSequenceHex ::= DigitSequenceHex "_"? [0-9a-f])
	:= 16 * MV(DigitSequenceHex) + MV([0-9a-f])
MV(DigitSequenceHTD ::= [0-9a-z])
	:= MV([0-9a-z])
MV(DigitSequenceHTD ::= DigitSequenceHTD "_"? [0-9a-z])
	:= 36 * MV(DigitSequenceHTD) + MV([0-9a-z])

MV([0-9a-z] ::= "0")  :=  MV([0-9a-f] ::= "0")  :=  MV([0-9] ::= "0")  :=  MV([0-7] ::= "0")  :=  MV([0-3] ::= "0")  :=  MV([0-1] ::= "0")  :=  0
MV([0-9a-z] ::= "1")  :=  MV([0-9a-f] ::= "1")  :=  MV([0-9] ::= "1")  :=  MV([0-7] ::= "1")  :=  MV([0-3] ::= "1")  :=  MV([0-1] ::= "1")  :=  1
MV([0-9a-z] ::= "2")  :=  MV([0-9a-f] ::= "2")  :=  MV([0-9] ::= "2")  :=  MV([0-7] ::= "2")  :=  MV([0-3] ::= "2")  :=  2
MV([0-9a-z] ::= "3")  :=  MV([0-9a-f] ::= "3")  :=  MV([0-9] ::= "3")  :=  MV([0-7] ::= "3")  :=  MV([0-3] ::= "3")  :=  3
MV([0-9a-z] ::= "4")  :=  MV([0-9a-f] ::= "4")  :=  MV([0-9] ::= "4")  :=  MV([0-7] ::= "4")  :=  4
MV([0-9a-z] ::= "5")  :=  MV([0-9a-f] ::= "5")  :=  MV([0-9] ::= "5")  :=  MV([0-7] ::= "5")  :=  5
MV([0-9a-z] ::= "6")  :=  MV([0-9a-f] ::= "6")  :=  MV([0-9] ::= "6")  :=  MV([0-7] ::= "6")  :=  6
MV([0-9a-z] ::= "7")  :=  MV([0-9a-f] ::= "7")  :=  MV([0-9] ::= "7")  :=  MV([0-7] ::= "7")  :=  7
MV([0-9a-z] ::= "8")  :=  MV([0-9a-f] ::= "8")  :=  MV([0-9] ::= "8")  :=  8
MV([0-9a-z] ::= "9")  :=  MV([0-9a-f] ::= "9")  :=  MV([0-9] ::= "9")  :=  9
MV([0-9a-z] ::= "a")  :=  MV([0-9a-f] ::= "a")  :=  10
MV([0-9a-z] ::= "b")  :=  MV([0-9a-f] ::= "b")  :=  11
MV([0-9a-z] ::= "c")  :=  MV([0-9a-f] ::= "c")  :=  12
MV([0-9a-z] ::= "d")  :=  MV([0-9a-f] ::= "d")  :=  13
MV([0-9a-z] ::= "e")  :=  MV([0-9a-f] ::= "e")  :=  14
MV([0-9a-z] ::= "f")  :=  MV([0-9a-f] ::= "f")  :=  15
MV([0-9a-z] ::= "g")  :=  16
MV([0-9a-z] ::= "h")  :=  17
MV([0-9a-z] ::= "i")  :=  18
MV([0-9a-z] ::= "j")  :=  19
MV([0-9a-z] ::= "k")  :=  20
MV([0-9a-z] ::= "l")  :=  21
MV([0-9a-z] ::= "m")  :=  22
MV([0-9a-z] ::= "n")  :=  23
MV([0-9a-z] ::= "o")  :=  24
MV([0-9a-z] ::= "p")  :=  25
MV([0-9a-z] ::= "q")  :=  26
MV([0-9a-z] ::= "r")  :=  27
MV([0-9a-z] ::= "s")  :=  28
MV([0-9a-z] ::= "t")  :=  29
MV([0-9a-z] ::= "u")  :=  30
MV([0-9a-z] ::= "v")  :=  31
MV([0-9a-z] ::= "w")  :=  32
MV([0-9a-z] ::= "x")  :=  33
MV([0-9a-z] ::= "y")  :=  34
MV([0-9a-z] ::= "z")  :=  35
```


### Keywords
```w3c
Keyword ::=
	KeywordStorage  |
	KeywordModifier

KeywordStorage ::=
	"let"

KeywordModifier ::=
	"unfixed"
```
Keywords are sequences of alphanumeric characters reserved by the Solid language
and enumerated in the lexical grammar.
Keywords convey certain semantics to the compiler and to programmers.

#### Static Semantics: Keyword Value
The Keyword Value (KV) of a keyword token is the unique mathematical integer ID
that distinguishes the keyword from the other keywords.
Keyword IDs are predetermined by the lexical grammar and are independent of any instance program.
Keyword values are mathematical integers ranging from *0* to *127* (inclusive).

This specification uses the term “ID” to refer to the identification,
as not to be confused with [Identifier tokens](#identifiers).

```w3c
KV(Keyword)
	:= given by the following map: {
		"let"     : \x00,
		"unfixed" : \x01,
	}
```


### Identifiers
```w3c
Identifier ::= ([A-Za-z_] [A-Za-z0-9_]* | "`" [^`#x03]* "`") - Keyword
```
Identifiers are sequences of alphanumeric characters that do not match the [Keyword](#keywords) production.
Identifiers are author-defined and point to values in a program.

Lexically, identifiers have two forms: basic identifiers and Unicode identifiers.
Basic identifiers must start with an alphabetic character or an underscore,
and thereafter may contain more alphanumeric characters or underscores.
Unicode identifiers are enclosed in back-ticks (`` `…` `` **U+0060 GRAVE ACCENT**),
and may contain any number of characters from the Unicode character set.

#### Static Semantics: Identifier Value
The Identifier Value (IV) of an identifier token is the unique mathematical integer ID
that distinguishes the identifier from other identifiers within a program.
Identifier values are mathematical integers strictly greater than *127*.

```w3c
IV(Identifier)
	:= (* TO BE DESCRIBED *)
```


### String Literals
```w3c
String ::= "'" StringChars? "'"

StringChars ::=
	[^'\#x03]               StringChars?   |
	"\"        StringEscape StringChars?   |
	"\u"      ([^'{#x03]    StringChars?)?

StringEscape ::= EscapeChar | EscapeCode | LineContinuation | NonEscapeChar

EscapeChar       ::= "'" | "\" | "s" | "t" | "n" | "r"
EscapeCode       ::= "u{" DigitSequenceHex? "}"
LineContinuation ::= #x0A
NonEscapeChar    ::= [^'\stnru#x0A#x03]
```
String tokens are sequences of Unicode characters enclosed in delimiters.
Strings are snippets of textual data.

#### Static Semantics: String Value
The text of the string in the source code is called the “raw” text of the token.
Before the token is sent to the parser, this “raw” text is transformed into a
String Value (SV), or, informally, “cooked” text.

```w3c
SV(String ::= "'" "'")
	:= <> /* the empty array */
SV(String ::= "'" StringChars "'")
	:= SV(StringChars)
SV(StringChars ::= [^'\#x03])
	:= UTF16Encoding(code point of that character)
SV(StringChars ::= [^'\#x03] StringChars)
	:= UTF16Encoding(code point of that character) followed by SV(StringChars)
SV(StringChars ::= "\" StringEscape)
	:= SV(StringEscape)
SV(StringChars ::= "\" StringEscape StringChars)
	:= SV(StringEscape) followed by SV(StringChars)
SV(StringChars ::= "\u")
	:= \x75 /* U+0075 LATIN SMALL LETTER U */
SV(StringChars ::= "\u" [^'{#x03'])
	:= \x75 followed by UTF16Encoding(code point of that character)
SV(StringChars ::= "\u" [^'{#x03'] StringChars)
	:= \x75 followed by UTF16Encoding(code point of that character) followed by SV(StringChars)
SV(StringEscape ::= EscapeChar)
	:= SV(EscapeChar)
SV(StringEscape ::= EscapeCode)
	:= SV(EscapeCode)
SV(StringEscape ::= LineContinuation)
	:= SV(LineContinuation)
SV(StringEscape ::= NonEscapeChar)
	:= SV(NonEscapeChar)
SV(EscapeChar ::= "'" | "\" | "s" | "t" | "n" | "r")
	:= given by the following map: {
		"'" : \x27, /* U+0027 APOSTROPHE           */
		"\" : \x5c, /* U+005C REVERSE SOLIDUS      */
		"s" : \x20, /* U+0020 SPACE                */
		"t" : \x09, /* U+0009 CHARACTER TABULATION */
		"n" : \x0a, /* U+000A LINE FEED (LF)       */
		"r" : \x0d, /* U+000D CARRIAGE RETURN (CR) */
	}
SV(EscapeCode ::= "u{" "}")
	:= \x0 /* U+0000 NULL */
SV(EscapeCode ::= "u{" DigitSequenceHex "}")
	:= UTF16Encoding(MV(DigitSequenceHex))
SV(LineContinuation ::= #x0A)
	:= \x20 /* U+0020 SPACE */
SV(NonEscapeChar ::= [^'\stnru#x0D#x0A#x03])
	:= UTF16Encoding(code point of that character)
```


### Template Literals
```w3c
TemplateFull   ::= "'''" TemplateChars__EndDelim ? "'''"
TemplateHead   ::= "'''" TemplateChars__EndInterp? "{{"
TempalteMiddle ::= "}}"  TemplateChars__EndInterp? "{{"
TempalteTail   ::= "}}"  TemplateChars__EndDelim ? "'''"

TemplateChars__EndDelim ::=
	[^'{#x03] TemplateChars__EndDelim?   |
	TemplateChars__EndDelim__StartDelim  |
	TemplateChars__EndDelim__StartInterp

TemplateChars__EndDelim__StartDelim ::=
	"'"    [^'{#x03] TemplateChars__EndDelim?                                         |
	"''"   [^'{#x03] TemplateChars__EndDelim?                                         |
	"'{"  ([^'{#x03] TemplateChars__EndDelim? | TemplateChars__EndDelim__StartDelim)? |
	"''{" ([^'{#x03] TemplateChars__EndDelim? | TemplateChars__EndDelim__StartDelim)?

TemplateChars__EndDelim__StartInterp ::=
	"{"   ([^'{#x03] TemplateChars__EndDelim?                                       )? |
	"{'"  ([^'{#x03] TemplateChars__EndDelim? | TemplateChars__EndDelim__StartInterp)  |
	"{''" ([^'{#x03] TemplateChars__EndDelim? | TemplateChars__EndDelim__StartInterp)

TemplateChars__EndInterp ::=
	[^'{#x03] TemplateChars__EndInterp?   |
	TemplateChars__EndInterp__StartDelim  |
	TemplateChars__EndInterp__StartInterp

TemplateChars__EndInterp__StartDelim ::=
	"'"   ([^'{#x03] TemplateChars__EndInterp?                                       )? |
	"''"  ([^'{#x03] TemplateChars__EndInterp?                                       )? |
	"'{"  ([^'{#x03] TemplateChars__EndInterp? | TemplateChars__EndInterp__StartDelim)  |
	"''{" ([^'{#x03] TemplateChars__EndInterp? | TemplateChars__EndInterp__StartDelim)

TemplateChars__EndInterp__StartInterp ::=
	"{"    [^'{#x03] TemplateChars__EndInterp?                                           |
	"{'"  ([^'{#x03] TemplateChars__EndInterp? | TemplateChars__EndInterp__StartInterp)? |
	"{''" ([^'{#x03] TemplateChars__EndInterp? | TemplateChars__EndInterp__StartInterp)?
```
Template tokens are almost exactly like string tokens, except that
they use different delimiters, and their “cooked” values are computed differently.
Template literal tokens can be combined together in
specific ways determined by the formal syntactic grammar.

#### Static Semantics: Template Value
The Template Value (TV) of a template token is the analogue of the SV of a string token.

```w3c
TV(TemplateFull ::= "'''" "'''")
	:= <>
TV(TemplateFull ::= "'''" TemplateChars__EndDelim "'''")
	:= TV(TemplateChars__EndDelim)

TV(TemplateHead ::= "'''" "{{")
	:= <>
TV(TemplateHead ::= "'''" TemplateChars__EndInterp "{{")
	:= TV(TemplateChars__EndInterp)

TV(TemplateMiddle ::= "}}" "{{")
	:= <>
TV(TemplateMiddle ::= "}}" TemplateChars__EndInterp "{{")
	:= TV(TemplateChars__EndInterp)

TV(TemplateTail ::= "}}" "'''")
	:= <>
TV(TemplateTail ::= "}}" TemplateChars__EndDelim "'''")
	:= TV(TemplateChars__EndDelim)

TV(TemplateChars__EndDelim ::= [^'{#x03])
	:= UTF16Encoding(code point of that character)
TV(TemplateChars__EndDelim ::= [^'{#x03] TemplateChars__EndDelim)
	:= UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndDelim)
TV(TemplateChars__EndDelim ::= TemplateChars__EndDelim__StartDelim)
	:= TV(TemplateChars__EndDelim__StartDelim)
TV(TemplateChars__EndDelim ::= TemplateChars__EndDelim__StartInterp)
	:= TV(TemplateChars__EndDelim__StartInterp)

TV(TemplateChars__EndDelim__StartDelim ::= "'" [^'{#x03])
	:= \x27 followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndDelim__StartDelim ::= "'" [^'{#x03] TemplateChars__EndDelim)
	:= \x27 followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndDelim)
TV(TemplateChars__EndDelim__StartDelim ::= "''" [^'{#x03])
	:= <\x27, \x27> followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndDelim__StartDelim ::= "''" [^'{#x03] TemplateChars__EndDelim)
	:= <\x27, \x27> followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndInterp)
TV(TemplateChars__EndDelim__StartDelim ::= "'{")
	:= <\x27, \x7b>
TV(TemplateChars__EndDelim__StartDelim ::= "'{" [^'{#x03])
	:= <\x27, \x7b> followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndDelim__StartDelim ::= "'{" [^'{#x03] TemplateChars__EndDelim)
	:= <\x27, \x7b> followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndDelim)
TV(TemplateChars__EndDelim__StartDelim ::= "'{" TemplateChars__EndDelim__StartDelim)
	:= <\x27, \x7b> followed by TV(TemplateChars__EndDelim__StartDelim)
TV(TemplateChars__EndDelim__StartDelim ::= "''{")
	:= <\x27, \x27, \x7b>
TV(TemplateChars__EndDelim__StartDelim ::= "''{" [^'{#x03])
	:= <\x27, \x27, \x7b> followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndDelim__StartDelim ::= "''{" [^'{#x03] TemplateChars__EndDelim)
	:= <\x27, \x27, \x7b> followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndDelim)
TV(TemplateChars__EndDelim__StartDelim ::= "''{" TemplateChars__EndDelim__StartDelim)
	:= <\x27, \x27, \x7b> followed by TV(TemplateChars__EndDelim__StartDelim)

TV(TemplateChars__EndDelim__StartInterp ::= "{")
	:= \x7b /* U+007B LEFT CURLY BRACKET */
TV(TemplateChars__EndDelim__StartInterp ::= "{" [^'{#x03])
	:= \x7b followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndDelim__StartInterp ::= "{" [^'{#x03] TemplateChars__EndDelim)
	:= \x7b followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndDelim)
TV(TemplateChars__EndDelim__StartInterp ::= "{'" [^'{#x03])
	:= <\x7b, \x27> followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndDelim__StartInterp ::= "{'" [^'{#x03] TemplateChars__EndDelim)
	:= <\x7b, \x27> followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndDelim)
TV(TemplateChars__EndDelim__StartInterp ::= "{'" TemplateChars__EndDelim__StartInterp)
	:= <\x7b, \x27> followed by TV(TemplateChars__EndDelim__StartInterp)
TV(TemplateChars__EndDelim__StartInterp ::= "{''" [^'{#x03])
	:= <\x7b, \x27, \x27> followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndDelim__StartInterp ::= "{''" [^'{#x03] TemplateChars__EndDelim)
	:= <\x7b, \x27, \x27> followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndDelim)
TV(TemplateChars__EndDelim__StartInterp ::= "{''" TemplateChars__EndDelim__StartInterp)
	:= <\x7b, \x27, \x27> followed by TV(TemplateChars__EndDelim__StartInterp)

TV(TemplateChars__EndInterp ::= [^'{#x03])
	:= UTF16Encoding(code point of that character)
TV(TemplateChars__EndInterp ::= [^'{#x03] TemplateChars__EndInterp)
	:= UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndInterp)
TV(TemplateChars__EndInterp ::= TemplateChars__EndInterp__StartDelim)
	:= TV(TemplateChars__EndInterp__StartDelim)
TV(TemplateChars__EndInterp ::= TemplateChars__EndInterp__StartInterp)
	:= TV(TemplateChars__EndInterp__StartInterp)

TV(TemplateChars__EndInterp__StartDelim ::= "'")
	:= \x27 /* U+0027 APOSTROPHE */
TV(TemplateChars__EndInterp__StartDelim ::= "'" [^'{#x03])
	:= \x27 followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndInterp__StartDelim ::= "'" [^'{#x03] TemplateChars__EndInterp)
	:= \x27 followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndInterp)
TV(TemplateChars__EndInterp__StartDelim ::= "''")
	:= <\x27, \x27>
TV(TemplateChars__EndInterp__StartDelim ::= "''" [^'{#x03])
	:= <\x27, \x27> followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndInterp__StartDelim ::= "''" [^'{#x03] TemplateChars__EndInterp)
	:= <\x27, \x27> followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndInterp)
TV(TemplateChars__EndInterp__StartDelim ::= "'{" [^'{#x03])
	:= <\x27, \x7b> followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndInterp__StartDelim ::= "'{" [^'{#x03] TemplateChars__EndInterp)
	:= <\x27, \x7b> followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndInterp)
TV(TemplateChars__EndInterp__StartDelim ::= "'{" TemplateChars__EndInterp__StartDelim)
	:= <\x27, \x7b> followed by TV(TemplateChars__EndInterp__StartDelim)
TV(TemplateChars__EndInterp__StartDelim ::= "''{" [^'{#x03])
	:= <\x27, \x27, \x7b> followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndInterp__StartDelim ::= "''{" [^'{#x03] TemplateChars__EndInterp)
	:= <\x27, \x27, \x7b> followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndInterp)
TV(TemplateChars__EndInterp__StartDelim ::= "''{" TemplateChars__EndInterp__StartDelim)
	:= <\x27, \x27, \x7b> followed by TV(TemplateChars__EndInterp__StartDelim)

TV(TemplateChars__EndInterp__StartInterp ::= "{" [^'{#x03])
	:= \x7b followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndInterp__StartInterp ::= "{" [^'{#x03] TemplateChars__EndInterp)
	:= \x7b followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndInterp)
TV(TemplateChars__EndInterp__StartInterp ::= "{'")
	:= <\x7b, \x27>
TV(TemplateChars__EndInterp__StartInterp ::= "{'" [^'{#x03])
	:= <\x7b, \x27> followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndInterp__StartInterp ::= "{'" [^'{#x03] TemplateChars__EndInterp)
	:= <\x7b, \x27> followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndInterp)
TV(TemplateChars__EndInterp__StartInterp ::= "{'" TemplateChars__EndInterp__StartInterp)
	:= <\x7b, \x27> followed by TV(TemplateChars__EndInterp__StartInterp)
TV(TemplateChars__EndInterp__StartInterp ::= "{''")
	:= <\x7b, \x27, \x27>
TV(TemplateChars__EndInterp__StartInterp ::= "{''" [^'{#x03])
	:= <\x7b, \x27, \x27> followed by UTF16Encoding(code point of that character)
TV(TemplateChars__EndInterp__StartInterp ::= "{''" [^'{#x03] TemplateChars__EndInterp)
	:= <\x7b, \x27, \x27> followed by UTF16Encoding(code point of that character) followed by TV(TemplateChars__EndInterp)
TV(TemplateChars__EndInterp__StartInterp ::= "{''" TemplateChars__EndInterp__StartInterp)
	:= <\x7b, \x27, \x27> followed by TV(TemplateChars__EndInterp__StartInterp)
```


### Comments
```w3c
Comment ::= CommentLine | CommentMulti | CommentBlock

CommentLine ::= "%" [^#x0A#x03]* #x0A

CommentMulti ::= "{%" CommentMultiNestChars? "%}"

CommentMultiChars ::=
	[^{%#x03] CommentMultiChars?       |
	"{" [^%#x03] CommentMultiChars?    |
	"%" ([^}#x03] CommentMultiChars?)? |
	CommentMulti CommentMultiChars?

CommentBlock ::= /*? following: #x0A [#x09#x20]* ?*/"%%%" #x0A (/*? unequal: [#x09#x20]* "%%%" ?*/[^#x03]* #x0A)? [#x09#x20]* "%%%" /*? lookahead: #x0A ?*/
```
Comments are tokens of arbitrary text,
mainly used to add human-readable language to code
or to provide other types of annotations.
Comment tokens are not sent to the Solid parser.

#### Line Comments
Line comments begin with `%` (**U+0025 PERCENT SIGN**).
The compiler will ignore all source text starting from `%` and onward,
up to and including the next line break (**U+000A LINE FEED (LF)**).

#### Multiline Comments
Multiline comments are contained in the delimiters `{% %}`
(**U+007B LEFT CURLY BRACKET**, **U+007C RIGHT CURLY BRACKET**, with adjacent percent signs),
and may contain line breaks and may be nested.

#### Block Comments
Block comments begin and end with triple percent signs `%%%`.
These delimiters *must* be on their own lines (with or without leading/trailing whitespace).
