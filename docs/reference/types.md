# Types
This chapter describes types of values in the Solid Language.

Solid is a strongly-typed language, meaning that types of values are determined at compile-time.
A strong type system can help prevent many runtime errors.

Solid Language Types are described in the [formal specification](../spec/data-types.md#solid-language-types).
This reference takes a more informative approach.



## Never
The Never type, `never`, is the Bottom type in the type hierarchy —
it contains no values and is a subtype of every other type.

The Never type is used to describe the return type of functions that never return,
or the type of an expression that never evaluates.

The Never type is most commonly a result of a type operation that produces the Bottom type,
for example, the intersection of two disjoint types.

There are no values assignble to the Never type.
Currently, there are no expressions assignable to it either, but
future versions of Solid will support expressions of type Never.



## Null
The Null type, `null`, has exactly one value, also called `null`.
The meaning of the `null` value is not specified, but it’s most commonly used as a placeholder
when no other value is appropriate.



## Boolean
The Boolean type, `bool`, has two logical values, called `true` and `false`.
These values are used for binary states.



## Integer
Integers, type `int`, are whole numbers, their negatives, and zero.

Integers are written as a series of digits, such as `0123`,
optionally preceded by a negative sign (`-0123`).
`0` and `-0` are identical.

Integers may be written in five other bases in addition to the default base 10:
bases 2, 4, 8, 16, and 36.

Raw Input  | Base | Mathematical Value (in decimal)
---------  | ---- | -------------------------------
`42`       | 10   | 42
`\d42`     | 10   | 42
`\b101010` |  2   | 42
`\q222`    |  4   | 42
`\o52`     |  8   | 42
`\x2a`     | 16   | 42
`\z16`     | 36   | 42

The underscore may be used as a numeric separator symbol, to visually group digits.
```
\b1_0011_1000_1000;
\q103_2020;
\o11_610;
\d5_000;
\x13_88;
\z3_u_w;
```
The numeric separator cannot appear at the beginning or end of an integer,
nor can it appear consecutively.

Integers can be added, subtracted, and multiplied like normal numbers.
However, when dividing integers, if getting a non-integer value, we will truncate the decimal
(round towards zero). Dividing by zero is an error.
In all operations on integers, bases can be mixed.
```
3 / 2;        %== 1
-3 / 2;       %== -1
\b110 * \q12; %== 36
```



## Float
Floating-point numbers, type `float`, are decimals, which offer finer precision for numerical data than integers do.
(In computers, there are no irrational (non-fractional) numbers, but we approximate them well.)

Floating numbers cannot be declared in any base other than decimal (10).
Exactly one decimal point must be present in a float literal.
```
0.25;
0.5;     % the leading whole number part is required
1.;      % but we can omit the trailing fractional part
0 . 5;   %> Error
```

Floats can be written in “scientific-like notation”, such as `6.022e23`.
This represents *6.022 &times; 10<sup>23</sup>*.
This notation consts of the following parts:
- the whole part (an integer)
- a decimal point (`.`)
- the fractional part (the decimal places)
- the symbol `e`
- the exponent part (an integer)

It’s called “scientific-like notation” because it’s technically not scientific notation:
The coefficient need not be between 1 and 10. `-42.0e-1` is a valid floating-point value.

Floating-point values can be operated on just as integers can.
There is no truncation for division, but dividing by zero still raises an error.
The floating-point value `0.0` is *not identical* to the value `-0.0`.

Float values are considered “contageous” in that they “infect” any integers they are operated with.
For example, in the expression `1 + 2.3`, the integer `1` is *coerced* into the float `1.0`,
giving the same result as `1.0 + 2.3`.
If an expression contains *any* float value anywhere, then
*all* the integers in the expression are coerced into floats.



## String
The String type, type `str`, represents textual data.

A “raw string” is the code written to construct the string, whereas
the “cooked string” is the actual string value.
“Cooking” is the process of transforming a raw string into its value,
which follows certain rules based on the kind of string.

There are two kinds of strings: string literals and string templates.


### String Literals
String literals are static and known at compile-time.
They’re delimited with single-quotes (`'` **U+0027 APOSTROPHE**).
```
let greeting: str = 'Hello, world!';
```

String literals may contain line breaks, which are preserved during “cooking”.
```
let pangram: str = 'The quick brown fox
jumps over the lazy dog.';
```
> 'The quick brown fox\
jumps over the lazy dog.'

#### Line Continuations
**Line continuations** let us hard-wrap long strings into several lines
in source code, without rendering the line breaks in the strings’ cooked values.
When we escape the line break with a backslash (`\` **U+005C REVERSE SOLIDUS**),
the line break is converted into a space.
```
let pangram: str = 'The quick brown fox\
jumps over the lazy dog.';
```
> 'The quick brown fox jumps over the lazy dog.'

#### Escaping Characters
Some characters are not allowed in string literals, and others are not easily typed.
The following special characters may be escaped:

Raw Input | Output Character     | Output Code
--------- | -------------------- | ------------
`\'`      | APOSTROPHE           | U+0027
`\\`      | REVERSE SOLIDUS      | U+005C
`\%`      | PERCENT SIGN         | U+0025
`\s`      | SPACE                | U+0020
`\t`      | CHARACTER TABULATION | U+0009
`\n`      | LINE FEED (LF)       | U+000A
`\r`      | CARRIAGE RETURN (CR) | U+000D
`\u{24}`  | DOLLAR SIGN          | U+0024

The code `\'` prints a literal apostrophe character without closing the string,
and `\\` prints a literal backslash character without escaping the following one.
```
'I am using apostrophes: I love \'strings\'!';
'I am using backslashes: I love \\nighttime coding\\!';
```
> 'I am using apostrophes: I love 'strings'!'
>
> 'I am using backslashes: I love \nighttime coding\\!'

(Note that the code `\nighttime` would be cooked as a line feed followed by “ighttime”,
since `\n` is the line feed character.)

The code `\%` prints a literal percent sign without initiating an [in-string comment](#in-string-comments).
```
'The 10\% discount was not enough.';
```
> 'The 10% discount was not enough.'

The code `\u{‹cp›}` escapes unicode characters, where ‹cp› is the code point of the character.
For example, `\u{24}` escapes the dollar sign symbol, since its code point is **U+0024**.
```
let price: str = '\u{24}3.99';
```
> '$3.99'

This is useful for writing non-ASCII characters in code.
```
'I\u{2019}m happy! \u{1_f600}';
```
> 'I’m happy! 😀'

Code points must be written as any number of lowercase hexadecimal digits
intermixed with underscores `[0-9a-f_]`.
(If no code point is supplied, **U+0000 NULL** is assumed.)

Other than for the special cases listed above, a backslash has no effect.
```
'I am using escaped quotation marks: I love \"strings\"!';
'I am using unescaped quotation marks: I love "strings"!';
'\Any non-special \character \may \be \escaped.';
```
> 'I am using escaped quotation marks: I love "strings"!'
>
> 'I am using unescaped quotation marks: I love "strings"!'
>
> 'Any non-special character may be escaped.'

#### In-String Comments
String literals may contain Solid comments.
Line comments begin with `%` (**U+0025 PERCENT SIGN**) and continue until (but not including) the next line break, and
multiline comments begin with `%%` and continue until (and including) the next `%%`.
Both kinds of comments will continue until their end delimiter unless the end of the string is reached first.
The commented content is removed from the string’s cooked value.

-
	```
	'The five boxing wizards % jump quickly.';
	```
	> 'The five boxing wizards '
-
	```
	'The five % boxing wizards
	jump quickly.';
	```
	> 'The five \
	> jump quickly.'
-
	```
	'The five %% boxing wizards %% jump quickly.';
	```
	> 'The five  jump quickly.'
-
	```
	'The five %% boxing
	wizards %% jump
	quickly.';
	```
	> 'The five  jump\
	> quickly.'

Multiline comments cannot be nested.
```
'The %% five %% boxing %% wizards %% jump quickly.';
```
> 'The  boxing  jump quickly.'


### String Templates
String templates are dynamic and may contain interpolated expressions.
They’re delimited with three single-quotes (`'''`).
```
let years: int = 10;
let greeting: str = '''I’ve been coding for {{ years }} years.
That’s about {{ 365 * years }} days.''';
```

#### Interpolation
String templates may contain interpolated expressions, which are enclosed within double-braces `{{ … }}`.
An interpolated expression is an expression that computes to a string.
```
let twelve: str = '12';
'''3 times 4 is {{ twelve }}''';
```
> '3 times 4 is 12'

If the type of an interpolated expression is not a string, it’s **coerced** into a string at run-time.
```
'''3 times 4 is {{ 3 * 4 }}''';
```
> '3 times 4 is 12'

If an interpolated expression is absent, the empty string is assumed.
```
'''3 times 4 is {{  }} twelve''';   %== '3 times 4 is  twelve'
'''3 times 4 is {{ '' }} twelve'''; %== '3 times 4 is  twelve'
```

Comments in interpolated expressions are ignored.
```
'''Pack {{ %% a multline comment %% }} my box
with five dozen {{ %% another
multiline comment %% 'liquor' }} jugs.''';
```
> 'Pack &nbsp;my box\
with five dozen liquor jugs.'

Be careful with single-line comments.
```
'''Hello {{ % a line comment }} world.'''; %> ParseError

'''Hello {{ % a line comment
}} world.''';                % ok
```

Comments *within* string templates are *not* ignored.
```
'''
Sphinx of black quartz,    % not a comment
judge my vow.              \% also not a comment

Sphinx of    %% also not a comment %%           black quartz,
judge        \%\% and this isn’t either \%\%    my vow.
''';
```

#### No Escapes
String templates may contain line breaks, but line continuations are not possible.
```
let pangram: str = '''Watch “Jeopardy!”,\
Alex Trebek’s fun TV quiz game.''';
```
> 'Watch “Jeopardy!”,\\\
Alex Trebek’s fun TV quiz game.'

In fact, no character escapes are possible inside string templates.
The cooked value of a string template matches its raw code.

Probably one of the most common uses of string templates is that they can contain DSLs,
“domain-specific languages”. For example, we might want to encode a CSS snippet in a string template:
```
let css_code: str = '''
	h1, h2, h3 {
		font-weight: bold;
	}
	blockquote {
		margin-left: 0.5in;
	}
''';
```
Because there are no character escapes, DSLs very easy to read and write in string templates.
```
let latex_code: str = '''
	\paragraph{The following equations explain how \emph{matter} and \emph{energy} are related.}
	\begin{align}
		E_0 &= mc^2 \\
		E   &= \frac{mc^2}{\sqrt{1-\frac{v^2}{c^2}}}
	\end{align}
''';
let javascript_code: str = '''
	var nonempty_string = 'Look, ma, no escaping (the apostrophes)!'
	var empty_string = ''
''';
```

If we want to escape special characters like code points or curly braces,
we can use string interpolation.
```
'''
We can’t escape code points: \u{24} will not print a dollar sign.
But we can interpolate a string literal: {{ '\u{24}' }}.

We also can’t escape \{\{ curly_braces \}\},
but we can {{ '{{ interpolate }}' }}.

Apostrophes can’t be escaped either: \'\'\' will print as it looks.
But here are three, interpolated: {{ '\'\'\'' }}

I {{ '\u{2764}' }} Unicode!
'''
```
> '\
> We can’t escape code points: \u{24} will not print a dollar sign.\
> But we can interpolate a string literal: $.\
> \
> We also can’t escape \\{\\{ curly_braces \\}\\},\
> but we can {{ interpolate }}.\
> \
> Apostrophes can’t be escaped either: \\'\\'\\' will print as it looks.\
> But here are three, interpolated: '''\
> \
> I ❤ Unicode!\
> '



## Object
The Object type, `obj`, is the type of all values, that is, every value is assignable to the Object type.



## Unknown
The Unknown type, `unknown`, is the Top type in the type hierarchy —
it contains every value and expression, and is a supertype of every other type.

The Unknown type is used to describe a value or expression about which nothing is known.
Therefore, the compiler will not assume it has any properties or is valid in some operations.

Every value and expression is assignble to the Unknown type.
Currently, since there are no valueless expressions,
the Unknown type is equivalent to the [Object](#object) type.
However, future versions of Solid will support expressions assignable to Unknown
that are not assignable to Object.
