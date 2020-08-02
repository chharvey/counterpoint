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
[UTF-8](https://tools.ietf.org/html/rfc3629) transmission format.

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


### Abstract Operation: UTF16Encoding
The abstract operation `UTF16Encoding` encodes a code point using the UTF-16 encoding algorithm.
```w3c
Sequence<RealNumber> UTF16Encoding(RealNumber n) :=
	1. *If* `n` is less than 0 or greater than \x10ffff:
		1. Throw a ParseError.
	2. *If* `n` is less than or equal to \xffff:
		1. *Return:* [n].
	3. *Let* `d` be `n - \x10000`.
	4. *Let* `cu1` be the integer quotient of `d / \x400`.
	5. *Let* `cu2` be the integer remainder of `d / \x400`.
	6. *Return:* [cu1 + \xd800, cu2 + \xdc00].
```


### Static Semantics: CodePoint
The `CodePoint` of a character is the integer index of its placement in the Unicode character set.
A code point is *not* a code unit. A code point is simply Unicode’s index of a character,
whereas a code unit is the [UTF-16-encoded](#abstract-operation-utf16encoding) value of that code point.
```w3c
CodePoint([#x00-#x10ffff]) -> RealNumber
	:= /* TO BE DESCRIBED */;
```



## Token Formation
After line break normalization,
the source text of a Solid file is converted into a sequence of input elements, called tokens.
The source text is scanned from left to right, repeatedly taking the longest possible
sequence of code points as the next token.
The lexical structure of Solid describes what sequence of characters form valid tokens,
which form the lowest-level building blocks of the language.

There are a small number of token types, each of which have a specific purpose.

```w3c
Goal<Comment, Radix, Separator> :::=
	| Filebound
	| Whitespace
	| Punctuator
	| Keyword
	| Identifier
	| Number<?Radix, ?Separator>
	| String
	| TemplateFull
	| TemplateHead
	| TemplateMiddle
	| TemplateTail
	| <Comment+>Comment
;
```

1. [File Bounds](#file-bounds)
1. [Whitespace](#whitespace)
1. [Punctuators](#punctuators)
1. [Keywords](#keywords)
1. [Identifiers](#identifiers)
1. [Numbers](#numbers)
1. [String Literals](#string-literals)
1. [Template Literals](#template-literals)
1. [Comments](#comments)


### File Bounds
```w3c
Filebound :::= #x02 | #x03;
```
File bound tokens are tokens that consist of exactly 1 character:
either **U+0002 START OF TEXT**, or **U+0003 END OF TEXT**.


### Whitespace
```w3c
Whitespace :::= (#x20 | #x09 | #x0A)+;
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
Punctuator :::= "(" | ")" | "+" | "-" | "^" | "*" | "/" | "=" | ";";
```
Punctuators are non-alphanumeric characters in the ASCII character set, or spans of such characters,
that add to the semantics of the Solid language.
Some punctuators are operators, which perform computations on values, and
some punctuators are delimiters, which separate certain code constructs from each other or group them together.

#### Static Semantics: TokenWorth (Punctuators)
The Token Worth of a Punctuator token is the unique [real number](./data-types.md#realnumber) ID
that distinguishes the punctuator from the other punctuators.
Token Worth quantities for punctuators are predetermined by the lexical grammar and are independent of any instance program.
Token Worth quantities for punctuators are integers ranging from *0* to *127* (inclusive).

This specification uses the term “ID” to refer to the identification,
as not to be confused with [Identifier tokens](#identifiers).

```w3c
TokenWorth(Punctuator :::= "(") -> RealNumber := \x00;
TokenWorth(Punctuator :::= ")") -> RealNumber := \x01;
TokenWorth(Punctuator :::= "+") -> RealNumber := \x02;
TokenWorth(Punctuator :::= "-") -> RealNumber := \x03;
TokenWorth(Punctuator :::= "^") -> RealNumber := \x04;
TokenWorth(Punctuator :::= "*") -> RealNumber := \x05;
TokenWorth(Punctuator :::= "/") -> RealNumber := \x06;
TokenWorth(Punctuator :::= ";") -> RealNumber := \x07;
TokenWorth(Punctuator :::= "=") -> RealNumber := \x08;
```


### Keywords
```w3c
Keyword :::=
	// literal
	| "null"
	| "false"
	| "true"
	// storage
	| "let"
	// modifier
	| "unfixed"
;
```
Keywords are sequences of alphanumeric characters reserved by the Solid language
and enumerated in the lexical grammar.
Keywords convey certain semantics to the compiler and to programmers.

#### Static Semantics: TokenWorth (Keywords)
The Token Worth of a Keyword token is the unique [real number](./data-types.md#realnumber) ID
that distinguishes the keyword from the other keywords.
Token Worth quantities for keywords are predetermined by the lexical grammar and are independent of any instance program.
Token Worth quantities for keywords are integers ranging from *128* to *255* (inclusive).

```w3c
TokenWorth(Keyword :::= "null")    -> RealNumber := \x80;
TokenWorth(Keyword :::= "false")   -> RealNumber := \x81;
TokenWorth(Keyword :::= "true")    -> RealNumber := \x82;
TokenWorth(Keyword :::= "let")     -> RealNumber := \x83;
TokenWorth(Keyword :::= "unfixed") -> RealNumber := \x84;
```


### Identifiers
```w3c
Identifier :::= ([A-Za-z_] [A-Za-z0-9_]* | "`" [^`#x03]* "`") - Keyword;
```
Identifiers are sequences of alphanumeric characters that do not match the [Keyword](#keywords) production.
Identifiers are author-defined and point to values in a program.

Lexically, identifiers have two forms: basic identifiers and Unicode identifiers.
Basic identifiers must start with an alphabetic character or an underscore,
and thereafter may contain more alphanumeric characters or underscores.
Unicode identifiers are enclosed in back-ticks (`` `…` `` **U+0060 GRAVE ACCENT**),
and may contain any number of characters from the Unicode character set.

#### Static Semantics: TokenWorth (Identifiers)
The Token Worth of an Identifier token is the unique [real number](./data-types.md#realnumber) ID
that distinguishes the identifier from other identifiers within a given program.
Token Worth quantities for identifiers are integers strictly greater than *255*.

```w3c
TokenWorth(Identifier) -> RealNumber
	:= /* TO BE DESCRIBED */
```


### Numbers
```w3c
Number<Radix, Separator> :::=
	| Integer<?Radix, ?Separator>
	| Float<?Separator>
;

Integer<Radix, Separator>
	:::= ("+" | "-")? IntegerDigits<?Radix, ?Separator>;

IntegerDigits<Radix, Separator> :::=
	| <Radix->DigitSequenceDec<?Separator>
	| <Radix+>("\b"  DigitSequenceBin<?Separator>)
	| <Radix+>("\q"  DigitSequenceQua<?Separator>)
	| <Radix+>("\o"  DigitSequenceOct<?Separator>)
	| <Radix+>("\d"? DigitSequenceDec<?Separator>)
	| <Radix+>("\x"  DigitSequenceHex<?Separator>)
	| <Radix+>("\z"  DigitSequenceHTD<?Separator>)
;

Float<Separator>
	:::= SignedDigitSequenceDec<?Separator> "." (FractionalPart<?Separator> ExponentPart<?Separator>?)?;

SignedDigitSequenceDec<Separator>
	:::= ("+" | "-")? DigitSequenceDec<?Separator>;

FractionalPart<Separator>
	:::= DigitSequenceDec<?Separator>;

ExponentPart<Separator>
	:::= "e" SignedDigitSequenceDec<?Separator>;

DigitSequenceBin<Separator> :::= (DigitSequenceBin <Separator+>"_"?)? [0-1];
DigitSequenceQua<Separator> :::= (DigitSequenceQua <Separator+>"_"?)? [0-3];
DigitSequenceOct<Separator> :::= (DigitSequenceOct <Separator+>"_"?)? [0-7];
DigitSequenceDec<Separator> :::= (DigitSequenceDec <Separator+>"_"?)? [0-9];
DigitSequenceHex<Separator> :::= (DigitSequenceHex <Separator+>"_"?)? [0-9a-f];
DigitSequenceHTD<Separator> :::= (DigitSequenceHTD <Separator+>"_"?)? [0-9a-z];
```
Numbers are literal constants that represent numeric mathematical values.
Currently, only positive and negative (and zero) integers are supported.

#### Static Semantics: TokenWorth (Numbers)
The Token Worth of a number token is the [real number](./data-types.md#realnumber) that the token represents.

There is a many-to-one relationship between tokens and Token Worth quantities.
For example, both the tokens containing `0042` and `+42`
have the same Token Worth: the integer *42*.

```w3c
TokenWorth(Integer :::= IntegerDigits) -> RealNumber
	:= TokenWorth(IntegerDigits);
TokenWorth(Integer :::= "+" IntegerDigits) -> RealNumber
	:= TokenWorth(IntegerDigits);
TokenWorth(Integer :::= "-" IntegerDigits) -> RealNumber
	:= -1 * TokenWorth(IntegerDigits);

TokenWorth(IntegerDigits :::= "\b"  DigitSequenceBin) -> RealNumber
	:= TokenWorth(DigitSequenceBin);
TokenWorth(IntegerDigits :::= "\q"  DigitSequenceQua) -> RealNumber
	:= TokenWorth(DigitSequenceQua);
TokenWorth(IntegerDigits :::= "\o"  DigitSequenceOct) -> RealNumber
	:= TokenWorth(DigitSequenceOct);
TokenWorth(IntegerDigits :::= "\d"? DigitSequenceDec) -> RealNumber
	:= TokenWorth(DigitSequenceDec);
TokenWorth(IntegerDigits :::= "\x"  DigitSequenceHex) -> RealNumber
	:= TokenWorth(DigitSequenceHex);
TokenWorth(IntegerDigits :::= "\z"  DigitSequenceHTD) -> RealNumber
	:= TokenWorth(DigitSequenceHTD);

TokenWorth(DigitSequenceBin :::= [0-1]) -> RealNumber
	:= TokenWorth([0-1]);
TokenWorth(DigitSequenceBin :::= DigitSequenceBin "_"? [0-1]) -> RealNumber
	:= 2 * TokenWorth(DigitSequenceBin) + TokenWorth([0-1]);
TokenWorth(DigitSequenceQua :::= [0-3]) -> RealNumber
	:= TokenWorth([0-3]);
TokenWorth(DigitSequenceQua :::= DigitSequenceQua "_"? [0-3]) -> RealNumber
	:= 4 * TokenWorth(DigitSequenceQua) + TokenWorth([0-3]);
TokenWorth(DigitSequenceOct :::= [0-7]) -> RealNumber
	:= TokenWorth([0-7]);
TokenWorth(DigitSequenceOct :::= DigitSequenceOct "_"? [0-7]) -> RealNumber
	:= 8 * TokenWorth(DigitSequenceOct) + TokenWorth([0-7]);
TokenWorth(DigitSequenceDec :::= [0-9]) -> RealNumber
	:= TokenWorth([0-9]);
TokenWorth(DigitSequenceDec :::= DigitSequenceDec "_"? [0-9]) -> RealNumber
	:= 10 * TokenWorth(DigitSequenceDec) + TokenWorth([0-9]);
TokenWorth(DigitSequenceHex :::= [0-9a-f]) -> RealNumber
	:= TokenWorth([0-9a-f]);
TokenWorth(DigitSequenceHex :::= DigitSequenceHex "_"? [0-9a-f]) -> RealNumber
	:= 16 * TokenWorth(DigitSequenceHex) + TokenWorth([0-9a-f]);
TokenWorth(DigitSequenceHTD :::= [0-9a-z]) -> RealNumber
	:= TokenWorth([0-9a-z]);
TokenWorth(DigitSequenceHTD :::= DigitSequenceHTD "_"? [0-9a-z]) -> RealNumber
	:= 36 * TokenWorth(DigitSequenceHTD) + TokenWorth([0-9a-z]);

TokenWorth([0-9a-z] :::= "0") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "0") -> RealNumber  :=  TokenWorth([0-9] :::= "0") -> RealNumber  :=  TokenWorth([0-7] :::= "0") -> RealNumber  :=  TokenWorth([0-3] :::= "0") -> RealNumber  :=  TokenWorth([0-1] :::= "0") -> RealNumber  :=  \x00;
TokenWorth([0-9a-z] :::= "1") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "1") -> RealNumber  :=  TokenWorth([0-9] :::= "1") -> RealNumber  :=  TokenWorth([0-7] :::= "1") -> RealNumber  :=  TokenWorth([0-3] :::= "1") -> RealNumber  :=  TokenWorth([0-1] :::= "1") -> RealNumber  :=  \x01;
TokenWorth([0-9a-z] :::= "2") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "2") -> RealNumber  :=  TokenWorth([0-9] :::= "2") -> RealNumber  :=  TokenWorth([0-7] :::= "2") -> RealNumber  :=  TokenWorth([0-3] :::= "2") -> RealNumber  :=  \x02;
TokenWorth([0-9a-z] :::= "3") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "3") -> RealNumber  :=  TokenWorth([0-9] :::= "3") -> RealNumber  :=  TokenWorth([0-7] :::= "3") -> RealNumber  :=  TokenWorth([0-3] :::= "3") -> RealNumber  :=  \x03;
TokenWorth([0-9a-z] :::= "4") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "4") -> RealNumber  :=  TokenWorth([0-9] :::= "4") -> RealNumber  :=  TokenWorth([0-7] :::= "4") -> RealNumber  :=  \x04;
TokenWorth([0-9a-z] :::= "5") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "5") -> RealNumber  :=  TokenWorth([0-9] :::= "5") -> RealNumber  :=  TokenWorth([0-7] :::= "5") -> RealNumber  :=  \x05;
TokenWorth([0-9a-z] :::= "6") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "6") -> RealNumber  :=  TokenWorth([0-9] :::= "6") -> RealNumber  :=  TokenWorth([0-7] :::= "6") -> RealNumber  :=  \x06;
TokenWorth([0-9a-z] :::= "7") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "7") -> RealNumber  :=  TokenWorth([0-9] :::= "7") -> RealNumber  :=  TokenWorth([0-7] :::= "7") -> RealNumber  :=  \x07;
TokenWorth([0-9a-z] :::= "8") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "8") -> RealNumber  :=  TokenWorth([0-9] :::= "8") -> RealNumber  :=  \x08;
TokenWorth([0-9a-z] :::= "9") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "9") -> RealNumber  :=  TokenWorth([0-9] :::= "9") -> RealNumber  :=  \x09;
TokenWorth([0-9a-z] :::= "a") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "a") -> RealNumber  :=  \x0a;
TokenWorth([0-9a-z] :::= "b") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "b") -> RealNumber  :=  \x0b;
TokenWorth([0-9a-z] :::= "c") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "c") -> RealNumber  :=  \x0c;
TokenWorth([0-9a-z] :::= "d") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "d") -> RealNumber  :=  \x0d;
TokenWorth([0-9a-z] :::= "e") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "e") -> RealNumber  :=  \x0e;
TokenWorth([0-9a-z] :::= "f") -> RealNumber  :=  TokenWorth([0-9a-f] :::= "f") -> RealNumber  :=  \x0f;
TokenWorth([0-9a-z] :::= "g") -> RealNumber  :=  \x010;
TokenWorth([0-9a-z] :::= "h") -> RealNumber  :=  \x011;
TokenWorth([0-9a-z] :::= "i") -> RealNumber  :=  \x012;
TokenWorth([0-9a-z] :::= "j") -> RealNumber  :=  \x013;
TokenWorth([0-9a-z] :::= "k") -> RealNumber  :=  \x014;
TokenWorth([0-9a-z] :::= "l") -> RealNumber  :=  \x015;
TokenWorth([0-9a-z] :::= "m") -> RealNumber  :=  \x016;
TokenWorth([0-9a-z] :::= "n") -> RealNumber  :=  \x017;
TokenWorth([0-9a-z] :::= "o") -> RealNumber  :=  \x018;
TokenWorth([0-9a-z] :::= "p") -> RealNumber  :=  \x019;
TokenWorth([0-9a-z] :::= "q") -> RealNumber  :=  \x01a;
TokenWorth([0-9a-z] :::= "r") -> RealNumber  :=  \x01b;
TokenWorth([0-9a-z] :::= "s") -> RealNumber  :=  \x01c;
TokenWorth([0-9a-z] :::= "t") -> RealNumber  :=  \x01d;
TokenWorth([0-9a-z] :::= "u") -> RealNumber  :=  \x01e;
TokenWorth([0-9a-z] :::= "v") -> RealNumber  :=  \x01f;
TokenWorth([0-9a-z] :::= "w") -> RealNumber  :=  \x020;
TokenWorth([0-9a-z] :::= "x") -> RealNumber  :=  \x021;
TokenWorth([0-9a-z] :::= "y") -> RealNumber  :=  \x022;
TokenWorth([0-9a-z] :::= "z") -> RealNumber  :=  \x023;
```


### String Literals
```w3c
String
	:::= "'" StringChars? "'";

StringChars :::=
	| [^'\#x03]               StringChars?
	| "\"        StringEscape StringChars?
	| "\u"      ([^'{#x03]    StringChars?)?
;

StringEscape :::=
	| "'" | "\" | "s" | "t" | "n" | "r"
	| "u{" DigitSequenceHex? "}"
	| #x0A
	| [^'\stnru#x0A#x03]
;
```
String tokens are sequences of Unicode characters enclosed in delimiters.
Strings are snippets of textual data.

#### Static Semantics: TokenWorth (Strings)
The Token Worth of a String token is a [sequence](./data-types.md#sequence)
of UTF-16-encoded code units computed by the various parts of the token.

A **code unit** is a [real integer number](./data-types.md#real-integer-numbers)
representing one character or part of a character in a string.
In the [UTF-16 encoding](#abstract-operation-utf16encoding),
characters in the Unicode character set are represented by either one or two code units.

There is a many-to-one relationship between tokens and Token Worth quantities.
For example, both the tokens containing `'ABC'` and `'\u{41}\u{42}\u{43}'`
have the same Token Worth: the sequence of code units *[65, 66, 67]*.

```w3c
TokenWorth(String :::= "'" "'") -> Sequence<RealNumber>
	:= [];
TokenWorth(String :::= "'" StringChars "'") -> Sequence<RealNumber>
	:= TokenWorth(StringChars);
TokenWorth(StringChars :::= [^'\#x03]) -> Sequence<RealNumber>
	:= [...UTF16Encoding(CodePoint([^'\#x03]))];
TokenWorth(StringChars :::= [^'\#x03] StringChars) -> Sequence<RealNumber>
	:= [...UTF16Encoding(CodePoint([^'\#x03])), ...TokenWorth(StringChars)];
TokenWorth(StringChars :::= "\" StringEscape) -> Sequence<RealNumber>
	:= TokenWorth(StringEscape);
TokenWorth(StringChars :::= "\" StringEscape StringChars) -> Sequence<RealNumber>
	:= [...TokenWorth(StringEscape), ...TokenWorth(StringChars)];
TokenWorth(StringChars :::= "\u") -> Sequence<RealNumber>
	:= [\x75]; // U+0075 LATIN SMALL LETTER U
TokenWorth(StringChars :::= "\u" [^'{#x03']) -> Sequence<RealNumber>
	:= [\x75, ...UTF16Encoding(CodePoint([^'{#x03']))];
TokenWorth(StringChars :::= "\u" [^'{#x03'] StringChars) -> Sequence<RealNumber>
	:= [\x75, ...UTF16Encoding(CodePoint([^'{#x03'])), ...TokenWorth(StringChars)];
TokenWorth(StringEscape :::= "'") -> Sequence<RealNumber> := [\x27]; // U+0027 APOSTROPHE
TokenWorth(StringEscape :::= "\") -> Sequence<RealNumber> := [\x5c]; // U+005C REVERSE SOLIDUS
TokenWorth(StringEscape :::= "s") -> Sequence<RealNumber> := [\x20]; // U+0020 SPACE
TokenWorth(StringEscape :::= "t") -> Sequence<RealNumber> := [\x09]; // U+0009 CHARACTER TABULATION
TokenWorth(StringEscape :::= "n") -> Sequence<RealNumber> := [\x0a]; // U+000A LINE FEED (LF)
TokenWorth(StringEscape :::= "r") -> Sequence<RealNumber> := [\x0d]; // U+000D CARRIAGE RETURN (CR)
TokenWorth(StringEscape :::= "u{" "}") -> Sequence<RealNumber>
	:= [\x00]; // U+0000 NULL
TokenWorth(StringEscape :::= "u{" DigitSequenceHex "}") -> Sequence<RealNumber>
	:= [...UTF16Encoding(TokenWorth(DigitSequenceHex))];
TokenWorth(StringEscape :::= #x0A) -> Sequence<RealNumber>
	:= [\x20]; // U+0020 SPACE
TokenWorth(StringEscape :::= [^'\stnru#x0D#x0A#x03]) -> Sequence<RealNumber>
	:= [...UTF16Encoding(CodePoint([^'\stnru#x0D#x0A#x03]))];
```


### Template Literals
```w3c
TemplateFull   :::= "'''" TemplateChars__EndDelim ? "'''";
TemplateHead   :::= "'''" TemplateChars__EndInterp? "{{" ;
TempalteMiddle :::= "}}"  TemplateChars__EndInterp? "{{" ;
TempalteTail   :::= "}}"  TemplateChars__EndDelim ? "'''";

TemplateChars__EndDelim :::=
	| [^'{#x03] TemplateChars__EndDelim?
	| TemplateChars__EndDelim__StartDelim
	| TemplateChars__EndDelim__StartInterp
;

TemplateChars__EndDelim__StartDelim :::=
	| "'"    [^'{#x03] TemplateChars__EndDelim?
	| "''"   [^'{#x03] TemplateChars__EndDelim?
	| "'{"  ([^'{#x03] TemplateChars__EndDelim? | TemplateChars__EndDelim__StartDelim)?
	| "''{" ([^'{#x03] TemplateChars__EndDelim? | TemplateChars__EndDelim__StartDelim)?
;

TemplateChars__EndDelim__StartInterp :::=
	| "{"   ([^'{#x03] TemplateChars__EndDelim?                                       )?
	| "{'"  ([^'{#x03] TemplateChars__EndDelim? | TemplateChars__EndDelim__StartInterp)
	| "{''" ([^'{#x03] TemplateChars__EndDelim? | TemplateChars__EndDelim__StartInterp)
;

TemplateChars__EndInterp :::=
	| [^'{#x03] TemplateChars__EndInterp?
	| TemplateChars__EndInterp__StartDelim
	| TemplateChars__EndInterp__StartInterp
;

TemplateChars__EndInterp__StartDelim :::=
	| "'"   ([^'{#x03] TemplateChars__EndInterp?                                       )?
	| "''"  ([^'{#x03] TemplateChars__EndInterp?                                       )?
	| "'{"  ([^'{#x03] TemplateChars__EndInterp? | TemplateChars__EndInterp__StartDelim)
	| "''{" ([^'{#x03] TemplateChars__EndInterp? | TemplateChars__EndInterp__StartDelim)
;

TemplateChars__EndInterp__StartInterp :::=
	| "{"    [^'{#x03] TemplateChars__EndInterp?
	| "{'"  ([^'{#x03] TemplateChars__EndInterp? | TemplateChars__EndInterp__StartInterp)?
	| "{''" ([^'{#x03] TemplateChars__EndInterp? | TemplateChars__EndInterp__StartInterp)?
;
```
Template tokens are almost exactly like string tokens, except that
they use different delimiters, and their “cooked” values are computed differently.
Template literal tokens can be combined together in
specific ways determined by the formal syntactic grammar.

#### Static Semantics: TokenWorth (Templates)
The Token Worth of a Template token is the analogue of the Token Worth of a String token.

```w3c
TokenWorth(TemplateFull :::= "'''" "'''") -> Sequence<RealNumber>
	:= [];
TokenWorth(TemplateFull :::= "'''" TemplateChars__EndDelim "'''") -> Sequence<RealNumber>
	:= TokenWorth(TemplateChars__EndDelim);

TokenWorth(TemplateHead :::= "'''" "{{") -> Sequence<RealNumber>
	:= [];
TokenWorth(TemplateHead :::= "'''" TemplateChars__EndInterp "{{") -> Sequence<RealNumber>
	:= TokenWorth(TemplateChars__EndInterp);

TokenWorth(TemplateMiddle :::= "}}" "{{") -> Sequence<RealNumber>
	:= [];
TokenWorth(TemplateMiddle :::= "}}" TemplateChars__EndInterp "{{") -> Sequence<RealNumber>
	:= TokenWorth(TemplateChars__EndInterp);

TokenWorth(TemplateTail :::= "}}" "'''") -> Sequence<RealNumber>
	:= [];
TokenWorth(TemplateTail :::= "}}" TemplateChars__EndDelim "'''") -> Sequence<RealNumber>
	:= TokenWorth(TemplateChars__EndDelim);

TokenWorth(TemplateChars__EndDelim :::= [^'{#x03]) -> Sequence<RealNumber>
	:= [...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndDelim :::= [^'{#x03] TemplateChars__EndDelim) -> Sequence<RealNumber>
	:= [...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndDelim)];
TokenWorth(TemplateChars__EndDelim :::= TemplateChars__EndDelim__StartDelim) -> Sequence<RealNumber>
	:= TokenWorth(TemplateChars__EndDelim__StartDelim);
TokenWorth(TemplateChars__EndDelim :::= TemplateChars__EndDelim__StartInterp) -> Sequence<RealNumber>
	:= TokenWorth(TemplateChars__EndDelim__StartInterp);

TokenWorth(TemplateChars__EndDelim__StartDelim :::= "'" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x27, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndDelim__StartDelim :::= "'" [^'{#x03] TemplateChars__EndDelim) -> Sequence<RealNumber>
	:= [\x27, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndDelim)];
TokenWorth(TemplateChars__EndDelim__StartDelim :::= "''" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x27, \x27, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndDelim__StartDelim :::= "''" [^'{#x03] TemplateChars__EndDelim) -> Sequence<RealNumber>
	:= [\x27, \x27, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndInterp)];
TokenWorth(TemplateChars__EndDelim__StartDelim :::= "'{") -> Sequence<RealNumber>
	:= [\x27, \x7b];
TokenWorth(TemplateChars__EndDelim__StartDelim :::= "'{" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x27, \x7b, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndDelim__StartDelim :::= "'{" [^'{#x03] TemplateChars__EndDelim) -> Sequence<RealNumber>
	:= [\x27, \x7b, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndDelim)];
TokenWorth(TemplateChars__EndDelim__StartDelim :::= "'{" TemplateChars__EndDelim__StartDelim) -> Sequence<RealNumber>
	:= [\x27, \x7b, ...TokenWorth(TemplateChars__EndDelim__StartDelim)];
TokenWorth(TemplateChars__EndDelim__StartDelim :::= "''{") -> Sequence<RealNumber>
	:= [\x27, \x27, \x7b];
TokenWorth(TemplateChars__EndDelim__StartDelim :::= "''{" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x27, \x27, \x7b, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndDelim__StartDelim :::= "''{" [^'{#x03] TemplateChars__EndDelim) -> Sequence<RealNumber>
	:= [\x27, \x27, \x7b, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndDelim)];
TokenWorth(TemplateChars__EndDelim__StartDelim :::= "''{" TemplateChars__EndDelim__StartDelim) -> Sequence<RealNumber>
	:= [\x27, \x27, \x7b, ...TokenWorth(TemplateChars__EndDelim__StartDelim)];

TokenWorth(TemplateChars__EndDelim__StartInterp :::= "{") -> Sequence<RealNumber>
	:= [\x7b]; // U+007B LEFT CURLY BRACKET
TokenWorth(TemplateChars__EndDelim__StartInterp :::= "{" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x7b, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndDelim__StartInterp :::= "{" [^'{#x03] TemplateChars__EndDelim) -> Sequence<RealNumber>
	:= [\x7b, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndDelim)];
TokenWorth(TemplateChars__EndDelim__StartInterp :::= "{'" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x7b, \x27, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndDelim__StartInterp :::= "{'" [^'{#x03] TemplateChars__EndDelim) -> Sequence<RealNumber>
	:= [\x7b, \x27, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndDelim)];
TokenWorth(TemplateChars__EndDelim__StartInterp :::= "{'" TemplateChars__EndDelim__StartInterp) -> Sequence<RealNumber>
	:= [\x7b, \x27, ...TokenWorth(TemplateChars__EndDelim__StartInterp)];
TokenWorth(TemplateChars__EndDelim__StartInterp :::= "{''" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x7b, \x27, \x27, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndDelim__StartInterp :::= "{''" [^'{#x03] TemplateChars__EndDelim) -> Sequence<RealNumber>
	:= [\x7b, \x27, \x27, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndDelim)];
TokenWorth(TemplateChars__EndDelim__StartInterp :::= "{''" TemplateChars__EndDelim__StartInterp) -> Sequence<RealNumber>
	:= [\x7b, \x27, \x27, ...TokenWorth(TemplateChars__EndDelim__StartInterp)];

TokenWorth(TemplateChars__EndInterp :::= [^'{#x03]) -> Sequence<RealNumber>
	:= [...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndInterp :::= [^'{#x03] TemplateChars__EndInterp) -> Sequence<RealNumber>
	:= [...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndInterp)];
TokenWorth(TemplateChars__EndInterp :::= TemplateChars__EndInterp__StartDelim) -> Sequence<RealNumber>
	:= TokenWorth(TemplateChars__EndInterp__StartDelim);
TokenWorth(TemplateChars__EndInterp :::= TemplateChars__EndInterp__StartInterp) -> Sequence<RealNumber>
	:= TokenWorth(TemplateChars__EndInterp__StartInterp);

TokenWorth(TemplateChars__EndInterp__StartDelim :::= "'") -> Sequence<RealNumber>
	:= [\x27]; // U+0027 APOSTROPHE
TokenWorth(TemplateChars__EndInterp__StartDelim :::= "'" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x27, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndInterp__StartDelim :::= "'" [^'{#x03] TemplateChars__EndInterp) -> Sequence<RealNumber>
	:= [\x27, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndInterp)];
TokenWorth(TemplateChars__EndInterp__StartDelim :::= "''") -> Sequence<RealNumber>
	:= [\x27, \x27];
TokenWorth(TemplateChars__EndInterp__StartDelim :::= "''" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x27, \x27, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndInterp__StartDelim :::= "''" [^'{#x03] TemplateChars__EndInterp) -> Sequence<RealNumber>
	:= [\x27, \x27, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndInterp)];
TokenWorth(TemplateChars__EndInterp__StartDelim :::= "'{" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x27, \x7b, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndInterp__StartDelim :::= "'{" [^'{#x03] TemplateChars__EndInterp) -> Sequence<RealNumber>
	:= [\x27, \x7b, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndInterp)];
TokenWorth(TemplateChars__EndInterp__StartDelim :::= "'{" TemplateChars__EndInterp__StartDelim) -> Sequence<RealNumber>
	:= [\x27, \x7b, ...TokenWorth(TemplateChars__EndInterp__StartDelim)];
TokenWorth(TemplateChars__EndInterp__StartDelim :::= "''{" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x27, \x27, \x7b, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndInterp__StartDelim :::= "''{" [^'{#x03] TemplateChars__EndInterp) -> Sequence<RealNumber>
	:= [\x27, \x27, \x7b, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndInterp)];
TokenWorth(TemplateChars__EndInterp__StartDelim :::= "''{" TemplateChars__EndInterp__StartDelim) -> Sequence<RealNumber>
	:= [\x27, \x27, \x7b, ...TokenWorth(TemplateChars__EndInterp__StartDelim)];

TokenWorth(TemplateChars__EndInterp__StartInterp :::= "{" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x7b, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndInterp__StartInterp :::= "{" [^'{#x03] TemplateChars__EndInterp) -> Sequence<RealNumber>
	:= [\x7b, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndInterp)];
TokenWorth(TemplateChars__EndInterp__StartInterp :::= "{'") -> Sequence<RealNumber>
	:= [\x7b, \x27];
TokenWorth(TemplateChars__EndInterp__StartInterp :::= "{'" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x7b, \x27, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndInterp__StartInterp :::= "{'" [^'{#x03] TemplateChars__EndInterp) -> Sequence<RealNumber>
	:= [\x7b, \x27, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndInterp)];
TokenWorth(TemplateChars__EndInterp__StartInterp :::= "{'" TemplateChars__EndInterp__StartInterp) -> Sequence<RealNumber>
	:= [\x7b, \x27, ...TokenWorth(TemplateChars__EndInterp__StartInterp)];
TokenWorth(TemplateChars__EndInterp__StartInterp :::= "{''") -> Sequence<RealNumber>
	:= [\x7b, \x27, \x27];
TokenWorth(TemplateChars__EndInterp__StartInterp :::= "{''" [^'{#x03]) -> Sequence<RealNumber>
	:= [\x7b, \x27, \x27, ...UTF16Encoding(CodePoint([^'{#x03]))];
TokenWorth(TemplateChars__EndInterp__StartInterp :::= "{''" [^'{#x03] TemplateChars__EndInterp) -> Sequence<RealNumber>
	:= [\x7b, \x27, \x27, ...UTF16Encoding(CodePoint([^'{#x03])), ...TokenWorth(TemplateChars__EndInterp)];
TokenWorth(TemplateChars__EndInterp__StartInterp :::= "{''" TemplateChars__EndInterp__StartInterp) -> Sequence<RealNumber>
	:= [\x7b, \x27, \x27, ...TokenWorth(TemplateChars__EndInterp__StartInterp)];
```


### Comments
```w3c
Comment :::=
	| CommentLine
	| CommentMulti
	| CommentBlock
;
```
Comments are tokens of arbitrary text,
mainly used to add human-readable language to code
or to provide other types of annotations.
Comment tokens are not sent to the Solid parser.

#### Line Comments
```
CommentLine
	:::= "%" [^#x0A#x03]* #x0A;
```
Line comments begin with `%` (**U+0025 PERCENT SIGN**).
The compiler will ignore all source text starting from `%` and onward,
up to and including the next line break (**U+000A LINE FEED (LF)**).

#### Multiline Comments
```
CommentMulti
	:::= "{%" CommentMultiNestChars? "%}";

CommentMultiChars :::=
	| [^{%#x03] CommentMultiChars?
	| "{"+ [^%#x03] CommentMultiChars?
	| "%"+ ([^}#x03] CommentMultiChars?)?
	| CommentMulti CommentMultiChars?
;
```
Multiline comments are contained in the delimiters `{% %}`
(**U+007B LEFT CURLY BRACKET**, **U+007C RIGHT CURLY BRACKET**, with adjacent percent signs),
and may contain line breaks and may be nested.

#### Block Comments
```
CommentBlock
	:::=
		{following: #x0A [#x09#x20]*}"%%%"
		#x0A
		({unequal: [#x09#x20]* "%%%"}[^#x03]* #x0A)?
		[#x09#x20]* "%%%"
		{lookahead: #x0A}
	;
```
Block comments begin and end with triple percent signs `%%%`.
These delimiters *must* be on their own lines (with or without leading/trailing whitespace).
