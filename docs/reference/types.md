# Types
This chapter describes types of values in the Counterpoint Programming Language.

Counterpoint is a strongly-typed language, meaning that types of values are determined at compile-time.
A strong type system can help prevent many runtime errors.

Counterpoint Language Types are described in the [formal specification](../spec/data-types.md#counterpoint-language-types).
This reference takes a more informative approach.



## Simple Types
Simple types are individual basic types. They cannot be broken up into smaller types.


### `never`
Type `never` is at the bottom of the type hierarchy —
it contains no values and is a subtype of every other type.

Type `never` is used to describe the return type of functions that never return,
or the type of an expression that never evaluates.

Type `never` is most commonly a result of a type operation that produces the Bottom type,
for example, the intersection of two disjoint types.


### `void`
Type `void` represents the completion of an evaluation but the absence of a value.
It is used to describe functions that complete execution (and may have side-effects), but return no value.
(Unlike `never`, `void` indicates that the function has returned.)
Type `void` is also used to represent part of the types of optional entries in collections,
such as a record’s optional property.
There are no values assignble to `void`, but some expressions may have type `void`,
for example, property access and function calls.


### `null`
Type `null` has exactly one value, also called `null`.
The meaning of the `null` value is not specified, but it’s most commonly used as a placeholder
when no other value is appropriate.


### `bool`
Type `bool` has two logical values, called `true` and `false`.
These values are used for binary states.


### `int`
Type `int` contains whole numbers, their negatives, and zero.

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


### `float`
Type `float` contains decimals, which offer finer precision for numerical data than integers do.
(In computers, there are no irrational (non-fractional) numbers, but we approximate them well.)

Floating numbers cannot be declared in any base other than decimal (10).
Exactly one decimal point must be present in a float literal.
```
0.25;
0.5;     % the leading whole number part is required
1.0;     % the trailing fractional part is also requied
0 . 5;   %> Error
```

Floats can be written in “scientific-like notation”, such as `6.022e23`.
This represents *6.022 &times; 10<sup>23</sup>*.
This notation consts of the following parts:
- the whole part (an integer)
- a decimal point (`.`)
- the fractional part (the decimal places)
- optionally, the symbol `e`
- if `e` present, the exponent part (an integer)

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


### `str`
Type `str` represents textual data.

A “raw string” is the code written to construct the string, whereas
the “cooked string” is the actual string value.
“Cooking” is the process of transforming a raw string into its value,
which follows certain rules based on the kind of string.

There are two kinds of strings: string literals and string templates.

#### String Literals
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

##### Line Continuations
**Line continuations** let us hard-wrap long strings into several lines
in source code, without rendering the line breaks in the strings’ cooked values.
When we escape the line break with a backslash (`\` **U+005C REVERSE SOLIDUS**),
the line break is converted into a space.
```
let pangram: str = 'The quick brown fox\
jumps over the lazy dog.';
```
> 'The quick brown fox jumps over the lazy dog.'

##### Escaping Characters
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

##### In-String Comments
String literals may contain Counterpoint comments.
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

#### String Templates
String templates are dynamic and may contain interpolated expressions.
They’re delimited with three single-quotes (`'''`).
```
let years: int = 10;
let greeting: str = '''I’ve been coding for {{ years }} years.
That’s about {{ 365 * years }} days.''';
```

##### Interpolation
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

##### No Escapes
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


### `obj`
Type `obj` is the type of all values, that is, every value is assignable to `obj`.
Expressions of type `void` cannot hold values, so they are not assignable to `obj`.


### `unknown`
Type  `unknown` is at the top of the type hierarchy —
it contains every value and expression, and is a supertype of every other type.

Type `unknown` is used to describe a value or expression about which nothing is known.
Therefore, the compiler will not assume it has any properties or is valid in some operations.


### Unit Types
Unit types are types that contain only one value.
In fact, the `null` type is already an example of a unit type! — it only holds the `null` value.
Because unit types can only hold a single constant value, they are sometimes called “constant types”,
although that term can be ambiguous in the context of generics, where types may be variable.

A unit type must be a single primitive literal, i.e., an Integer, Float, or String (and of course `null`),
and any value assignable to it must compute to that value. Variables with a unit type may still be reassignable,
but they can only be reassigned to the same value, so having an `unfixed` variable with a unit type is kind of pointless.
Variables with unit types are conventionally written in MACRO_CASE.
```
let unfixed TAU: true = true;
TAU = true;
TAU = false; %> TypeError

let unfixed CAR_WHEELS: 4 = 4;
let CAT_FEET: \b100 = \o4;
CAR_WHEELS = CAT_FEET;
```

The assigned value doesn’t need to be a literal; it may be an expression,
as long as it’s computable by the compiler’s [constant folding](./configuration.md#constantFolding) mechanism.
```
let TAU: true = !false;
let CAR_WHEELS: \b100 = \o10 / 2;
```

#### String Unit Types
Unit types may also be [strings](#str), but there are few details that should be noted.

String unit types are compared by **string value**.
This means both the type and the value are computed before the assignment takes place.
String unit types can also contain escape sequences and special characters.
```
let GREETING: 'H\u{e9}llo\sW\u{f6}rld!' = 'Héllo Wörld!';
let COUNT: '1
2\
3	4' = '1\n2 3\t4';
```

If the compiler can compute the value of a string template, then it may also be assigned to a string unit type.
```
let hello: str = 'Hello';
let world: str = 'World';
let GREETING: 'Hello World!' = '''{{ hello }} {{ world }}!''';
```
Notice that even though the variables `hello` and `world` are *not* declared with unit types (`str` is not a unit type),
the compiler is still able to compute their values, thus the assignment to `GREETING` is valid.
However, if they were unfixed, that wouldn’t be possible.
```
let unfixed hello: str = 'Hello';
let unfixed world: str = 'World';
let GREETING: 'Hello World!' = '''{{ hello }} {{ world }}!'''; %> TypeError
```
This is because the type of the template can only be inferred as `str`,
which is wider than the unit type it’s being assigned to.

String templates *cannot* be used as unit types (even if they’re templates without interpolation).
```
let GREETING: '''Hello World!''' = 'Hello World!'; %> ParseError
```



## Compound Types
Compound types are composed of other types.

Type               | Size     | Indices/Keys  | Generic Type Syntax | Explicit Type Syntax         | Constructor Syntax                           | Literal Syntax                         | Empty Literal Syntax
------------------ | -------- | ------------  | ------------------- | ---------------------------- | -------------------------------------------- | -------------------------------------- | --------------------
[Tuple](#tuples)   | Fixed    | integers      | *(none)*            | `[str, str, str]` / `str[3]` | *(none)*                                     | `['x', 'y', 'z']`                      | `[]`
[Record](#records) | Fixed    | words         | *(none)*            | `[a: str, b: str, c: str]`   | *(none)*                                     | `[a= 'x', b= 'y', c= 'z']`             | *(none)*
[List](#lists)     | Variable | integers      | `List.<str>`        | `str[]`                      | `List.(['x', 'y', 'z'])`                     | *(none)*                               | *(none)*
[Dict](#dicts)     | Variable | atoms/strings | `Dict.<str>`        | `[:str]`                     | `Dict.([a= 'x', b= 'y', c= 'z'])`            | *(none)*                               | *(none)*
[Set](#sets)       | Variable | *(none)*      | `Set.<str>`         | `str{}`                      | `Set.(['x', 'y', 'z'])`                      | `{'x', 'y', 'z'}`                      | `{}`
[Map](#maps)       | Variable | objects       | `Map.<str, str>`    | `{str -> str}`               | `Map.([['u', 'x'], ['v', 'y'], ['w', 'z']])` | `{'u' -> 'x', 'v' -> 'y', 'w' -> 'z'}` | *(none)*


### Tuples
Tuples are fixed-size ordered lists of indexed values, with indices starting at `0`.
The values in a tuple are called **items** (the actual values) or **entries** (the slots the values are stored in).
The number of entries in a tuple is called its **count**.
The count of a tuple is fixed and known at compile-time, as is the type of each entry in the tuple.
The order of entries is significant: looping and iteration are performed in index order.
Tuples are heterogeneous, meaning they can be declared with different entry types.
If a tuple is mutable, the entries of the tuple may be reassigned, but only to values of the correct type.

For example, the tuple `[3, 4.0, 'seven']` has an integer in the first position at index `0`,
followed by a float at index `1`, followed by a string at index `2`. Its count is 3.
Entries cannot be added or removed — the count of the tuple cannot change — but entries can be reassigned:
We could set the last entry to the string `'twelve'`.

Tuple literals are comma-separated expressions within square brackets.
Tuple types use the same syntax, but instead of value expressions
they contain type expressions (a.k.a. types).
```
let elements: [str, str, str] = ['earth', 'wind', 'fire'];
```
Larger tuples are always assignable to smaller tuples, as long as the types match.
```
let elements: [str, str, str] = ['earth', 'wind', 'fire', true, 42];
```
The above declaration is allowed because the last two items are simply dropped off.

However, assigning a smaller tuple to a larger tuple results in a TypeError.
```
let elements_and_more: [str, str, str, bool, int] = ['earth', 'wind', 'fire']; %> TypeError
```

Note: If a tuple is homogeneous (its items are all of the same type),
then we can use shorthand notation to annotate it:
```
let elements: str[3] = ['earth', 'wind', 'fire'];
%             ^ shorthand for `[str, str, str]`
```

#### Tuple Access
Items of a tuple can be accessed via 0-based **dot-accessor notation**
(index `0` represents the first item).
```
let elements: [str, str, str] = ['earth', 'wind', 'fire'];
elements.0; %== 'earth'
elements.1; %== 'wind'
elements.2; %== 'fire'
```

Since tuples have integer indices, we can use other bases:
```
elements.\b01; %== 'wind'
elements.\b10; %== 'fire'
```

Negative indices count backwards from the end of the list.
Index `-1` represents the last item, index `-2` represents the penultimate item, etc.
```
elements.-1;    %== 'fire'
elements.-\b10; %== 'wind'
```

Tuple size is known at compile-time,
so attempting to retrieve an out-of-bounds index results in a compile-time error.
Positive indices beyond the end of the list, and negative indices beyond the beginning,
result in a TypeError. In other words, the indices *do not* loop around.
```
elements.3;  %> TypeError
elements.-4; %> TypeError
```

Tuple items can also be accessed by **bracket-accessor notation**,
where the expression in brackets computes the index.
```
elements.[0];       %== 'earth'
elements.[3 - 2];   %== 'wind'
elements.[-3 + 2];  %== 'fire'
elements.[0.5 * 2]; %> TypeError % expected int but found float
```

A TypeError is produced when the compiler can determine if the index is out-of-bounds.
```
let i: int = 4;
elements.[i];   %> TypeError % index `4` does not exist on type `str[3]`
```
If the compiler can’t compute the index, it won’t error at all,
but this means the program could crash at runtime.
```
let unfixed i: int = 4;
elements.[i];           % no compile-time error, but value at runtime will be undefined
```

If a variable is declared as a mutable tuple, its indices may be reassigned, but its type or size cannot change.
A non-mutable tuple’s items, type, and size are all fixed.
```
let mut_tuple: mutable [bool, int, str] = [true, 4, 'hello'];
set mut_tuple.0 = false;
set mut_tuple.1 = 2;
set mut_tuple.2 = 'world';
mut_tuple; %== [false, 2, 'world'];

let tuple: [bool, int, str] = [true, 4, 'hello'];
set tuple.0 = false;   %> MutabilityError
set tuple.1 = 2;       %> MutabilityError
set tuple.2 = 'world'; %> MutabilityError
tuple; %== [true, 4, 'hello'];
```

#### Optional Items
Tuple types may have optional items, indicating that a tuple of that type might or might not have that item.
```
let unfixed x: [str, int, ?: bool] = ['hello', 42];
x = ['hello', 42, true];
```
The symbol `?:` in the type signature indicates that the item is optional.
In a tuple type, all optional items *must* come after all required items.

When we access an optional item, its type is unioned with `void`,
because the compiler doesn’t know if there’s an actual value there.
Evaluating such an expression could result in a runtime error, since void expressions have no actual value.
```
let x2: bool | void = x.2; % potential runtime error
```
However, the [optional access operator](./expressions-operators.md#optional-access) `?.`
can anticipate this error and return `null` whenever the value doesn’t exist.
```
let x2: bool? = x?.2;
```
If `x.2` exists, the expression `x?.2` produces that value; otherwise it produces `null`,
avoiding the runtime error.

We can use the [claim access operator](./expressions-operators.md#claim-access) `!.`
to tell the type-checker that the property definitely exists and is not type `void`.
It should only be used if we are certain the property exists.
```
let x2: bool = x!.2;
```
The expression `x!.2` behaves just like `x.2`, except that it bypasses the compiler’s TypeError.


### Records
Records are fixed-size unordered lists of keyed values. Key–value pairs are called **properties**,
where **keys** are keywords or identifiers, and **values** are expressions.
The number of properties in a record is called its **count**.
The count and types of record **entries** (the “slots” where values are stored) are fixed and known at compile-time.
The order of entries is *not* significant: though records can be iterated over, the order in which this is done is
implementation-dependent; thus authors should not rely on any particular iteration order.
Records are heterogeneous, meaning they can be declared with different entry types.
Record entries cannot be added or deleted, but if the record is mutable, they can be reassigned.

For example, given the record
```
[
	fontFamily= 'sans-serif',
	fontSize=   1.25,
	fontStyle=  'oblique',
	fontWeight= 400,
];
```
we could reassign the `fontWeight` property a value of `700`. Its count is 4.

Keys may be reserved keywords, not just restricted to identifiers.
This is because the record key will always be lexically bound to the record —
it will never stand alone, so there’s no risk of syntax error.
```
[
	let=   'to initialize a variable',
	is=    'referential identity',
	int=   'the Integer type',
	false= 'the negative boolean value',
];
```
Conventionally, whitespace is omitted between the key name and the equals sign delimiter `=`.
This practice helps programmers differentiate between record properties and variable declarations/assignments.

Record literals cannot contain the same key more than once.
```
[
	fontFamily= 'sans-serif',
	fontSize=   1.25,
	fontFamily= 'serif',      %> AssignmentError
];
```
> AssignmentError: Duplicate record key: `fontFamily` is already set.

Record literal types are similar to record values, except that the colon `:` is used as the key–value delimiter,
and the property values are replaced with types.
```
type StyleMap = [
	fontWeight: int,
	fontStyle:  'normal' | 'italic' | 'oblique',
	fontSize:   float,
	fontFamily: str,
];
let my_styles: StyleMap = [
	fontFamily= 'sans-serif',
	fontSize=   1.25;
	fontStyle=  'oblique',
	fontWeight= 400,
];
```
Notice how the properties may be written out of order. Records are famous for being order-independent,
and we should not assume that any looping or iteration over a record is performed in any particular order.
However, *code evaluation* is always left-to-right and top-to-bottom, which means that if any entries
cause any side-effects, those side-effects will be observed in the order the entries are written.
(This is significant if any values are function calls for example.)

Record keys point to unique values. Latter properties take precedence.
```
let elements: [
	socrates:  str,
	plato:     str,
	aristotle: str,
] = [
	socrates=  'earth',
	plato=     'wind',
	aristotle= 'fire',
	plato=     'water',
];
```
The value of the `plato` key will be `'water'`.

Larger records are always assignable to smaller records, as long as the types match.
```
let elements: [
	socrates:  str,
	plato:     str,
	aristotle: str,
] = [
	socrates=   'earth',
	euclid=     true,
	plato=      'wind',
	pythagoras= 42,
	aristotle=  'fire',
];
```
The above declaration is allowed because the unused properties are simply dropped off.

However, assigning a smaller record to a larger record results in a TypeError.
```
let elements_and_more: [
	socrates:   str,
	plato:      str,
	aristotle:  str,
	euclid:     bool,
	pythagoras: int,
] = [
	socrates=  'earth',
	plato=     'wind',
	aristotle= 'fire',
]; %> TypeError
```

#### Record Access
Values of a record can be accessed via **dot-accessor notation**.
```
let elements: [
	socrates:  str,
	plato:     str,
	aristotle: str,
] = [
	socrates=  'earth',
	plato=     'wind',
	aristotle= 'fire',
];
elements.socrates;  %== 'earth'
elements.plato;     %== 'wind'
elements.aristotle; %== 'fire'
```

Record keys are known at compile-time,
so attempting to retrieve an non-existent key results in a compile-time error.
```
elements.pythagoras; %> TypeError
```

If a variable is declared as a mutable record, its keys may be reassigned, but its type or size cannot change.
A non-mutable record’s values, type, and size are all fixed.
```
let mut_record: mutable [a: bool, b: int, c: str] = [a= true, b= 4, c= 'hello'];
set mut_record.a = false;
set mut_record.b = 2;
set mut_record.c = 'world';
mut_record; %== [a= false, b= 2, c= 'world'];

let record: [a: bool, b: int, c: str] = [a= true, b= 4, c= 'hello'];
set record.a = false;   %> MutabilityError
set record.b = 2;       %> MutabilityError
set record.c = 'world'; %> MutabilityError
record; %== [a= true, b= 4, c= 'hello'];
```

#### Optional Properties
Record types may have optional properties, indicating that a record of that type might or might not have that property.
```
let unfixed y: [firstname: str, middlename?: str, lastname: str] = [
	firstname= 'Martha',
	lastname=  'Dandridge',
];
y = [
	firstname=  'Martha',
	lastname=   'Washington',
	middlename= 'Dandridge',
];
```
The symbol `?:` in the type signature indicates that the property is optional.
In a record type, required and optional properties may be intermixed (order isn’t enforced).

When we access an optional property, its type is unioned with `void`,
because the compiler doesn’t know if there’s an actual value there.
Evaluating such an expression could result in a runtime error, since void expressions have no actual value.
```
let ym: str | void = y.middlename; % potential runtime error
```
However, the [optional access operator](./expressions-operators.md#optional-access) `?.`
can anticipate this error and return `null` whenever the value doesn’t exist.
```
let ym: str? = y?.middlename;
```
If `y.middlename` exists, the expression `y?.middlename` produces that value; otherwise it produces `null`,
avoiding the runtime error.

We can use the [claim access operator](./expressions-operators.md#claim-access) `!.`
to tell the type-checker that the property definitely exists and is not type `void`.
It should only be used if we are certain the property exists.
```
let ym: str = y!.middlename;
```
The expression `y!.middlename` behaves just like `y.middlename`, except that it bypasses the compiler’s TypeError.


### Lists
Lists are variable-size ordered lists of indexed values, with indices starting at `0`.
The values in a list are called **items** (the actual values) or **entries** (the slots the values are stored in).
The number of entries in a list is called its **count**; the count of a list is variable and unknown at compile-time.
Lists are homogeneous, meaning all entries in the list have the same type (or parent type).
If a list is mutable, the entries of the list may be reassigned, and items may be added and removed from the list as well.

List types are declared via the generic list type syntax: `List.<T>`
where `T` indicates the type of items in the list.
Lists are constructed via the constructor syntax `List.<T>(arg)`,
where `arg` is a [Tuple](#tuples) object.
```
let elements: List.<str> = List.<str>(['earth', 'wind', 'fire']);
```
A shorthand for the generic syntax `List.<T>` is `T[]`.
We can mix item types, but the list type must be homogeneous.
```
let elements: (str | bool | int)[] = List.<str | bool | int>(['earth', 'wind', 'fire', true, 42]);
```
The compiler considers all items in the list as having the same type.
For example, the expression `elements.[0]` is of type `str | bool | int`,
and if the list were mutable, we could reassign that entry to an integer or boolean.

#### List Access
List access is the same as [Tuple Access](#tuple-access).


### Dicts
Dicts (dictionaries) are variable-size unordered lists of keyed values. Key–value pairs are called **properties**,
where **keys** are keywords or identifiers, and **values** are expressions.
The number of properties in a record is called its **count**; the count of a dict is variable and unknown at compile-time.
Dicts are homogeneous, meaning all entries in the dict have the same type (or parent type).
If a dict is mutable, the entries of the dict may be reassigned, and properties may be added and removed from the dict as well.

Dict types are declared via the generic dict type syntax: `Dict.<T>`
where `T` indicates the type of values in the dict.
Dicts are constructed via the constructor syntax `Dict.<T>(arg)`,
where `arg` is a [Record](#records) object.
```
let my_styles: Dict.<int | float | str> = Dict.<int | float | str>([
	fontFamily= 'sans-serif',
	fontSize=   1.25,
	fontStyle=  'oblique',
	fontWeight= 400,
]);
```
A shorthand for the generic syntax `Dict.<T>` is `[:T]`.
As shown above, we can mix value types, but the dict type must be homogeneous.

#### Dict Access
Dict access is the same as [Record Access](#record-access).


### Sets
Sets are variable-sized unordered lists of values.
The values in a set are called **elements**. The number of elements in a set is called its **count**.

Set types are declared via the generic set type syntax: `Set.<T>`
where `T` indicates the type of elements in the set.
Sets may be constructed via the constructor syntax `Set.<T>(arg)`,
where `arg` is a [Tuple](#tuples) object of elements.
```
let elements: Set.<str> = Set.<str>(['earth', 'wind', 'fire']);
```
The set above has elements of one type.
Typically this will be the case, but it’s possible for a set to contain a mix of different element types.

A shorthand for the generic syntax `Set.<T>` is `T{}`,
and the set literal shorthand syntax is a sequence of comma-separated expressions within curly braces.
```
let elements: str{} = {'earth', 'wind', 'fire'};
```

The size of sets is not known at compile-time, and could change during run-time, if the set is mutable.
For example, a program could add an element to the above set after it’s been declared, changing its count.
The order of elements in a set is not necessarily significant.

Sets cannot contain identical elements (elements that are “the same object”).
If a set is declared with duplicates, they are collapsed:
The set `{'water', 'water'}` only conains 1 element.
Sets may have several elements that are un-identical but “equal”.
```
let x: [str] = ['water'];
let y: [str] = ['water'];
let elements: (float | [str]){} = {0.0, -0.0, x, y};
```
In this example, the elements `0.0` and `-0.0` are not identical
(even if they are equal by the floating-point definition of equality).
Similarly, `x` and `y` are not identical, but they are equal by tuple composition.
Even though `0.0 == -0.0` and `x == y`, this set has four elements.

#### Set Access
Elements of a set can be accessed via **bracket-accessor notation**,
where the expression in the brackets is the element to get.
The value is `true` if the element is in the set, and `false` if not.
```
let bases: obj{} = {
	'who',
	['what'],
	{ 'i' -> {'don’t' -> 'know'} },
};
bases.['''{{ 'w' }}{{ 'h' }}{{ 'o' }}''']; %== true
bases.[['what']];                          %== true
bases.['idk'];                             %== false
```

A TypeError is produced when the expression is not assignable to the set’s invariant.
```
let a: int = 3;
bases.[a];      %> TypeError
```


### Maps
Maps are variable-sized unordered lists of antecedent-consequent pairs.
Maps form associations (**cases**) of values (**antecedents**) to other values (**consequents**).
The antecedents are unique (by identity) in that each antecedent can be associated with only one consequent.
The number of cases in a map is called its **count**.

Map types are declared via the **generic map type syntax**: `Map.<K, V>`
where `K` indicates the type of antecedents and `V` indicates the type of consequents in the map.
Maps may be constructed via the constructor syntax `Map.<K, V>(arg)`,
where `arg` is a [Tuple](#tuples) object of key-value pairs (also tuples).
```
let bases: Map.<int | str, obj> = Map.<int | str, obj>([
	[1,     'who'],
	['2nd', ['what']],
	[1 + 2, { 'i' -> {'don’t' -> 'know'} }],
]);
```
The map above has antecedents and consequents of various types.
Typically, all the antecedents will be of one type and all the consequents will be of one type,
but this isn’t a requirement.

A shorthand for the generic syntax `Map.<K, V>` is `{K -> V}`,
and the map literal shorthand syntax is a sequence of comma-separated `key -> value` pairs within curly braces.
```
let bases: {int | str -> obj} = {
	1     -> 'who',
	'2nd' -> ['what'],
	1 + 2 -> { 'i' -> {'don’t' -> 'know'} },
};
```

The size of maps is not known at compile-time, and could change during run-time, if the map is mutable.
For example, a program could add a case to the above map after it’s been declared, changing its count.
Like records, the order of entries in a map is not necessarily significant.

Also like records, antecedents have unique consequents in that latter declarations take precedence.
In the case of maps, antecedents that are identical are considered “the same object”.
```
let bases: {int | str -> obj} = {
	1     -> 'who',
	'2nd' -> ['what'],
	1 + 2 -> { 'i' -> {'don’t' -> 'know'} },
	4 - 1 -> [i= [`don’t`= 'know']],
};
```
The consequent corresponding to the antecedent `3` will be `` [i= [`don’t`= 'know']] ``.

Maps may have several antecedents that are un-identical but “equal”.
```
let x: [int] = [3];
let y: [int] = [3];
let bases: {float | [int] -> obj} = {
	0.0  -> 'who',
	-0.0 -> ['what'],
	x    -> { 'i' -> {'don’t' -> 'know'} },
	y    -> [i= [`don’t`= 'know']],
};
```
In this example, the antecedents `0.0` and `-0.0` are not identical
(even if they are equal by the floating-point definition of equality).
Thus we are able to retrieve the different consequents at each of those antecedents.
Similarly, `x` and `y` are not identical, but they are equal by tuple composition.
Even though `0.0 == -0.0` and `x == y`, this map has four entries.

#### Map Access
Consequents of a map can be accessed via **bracket-accessor notation**,
where the expression in the brackets is the antecedent to get.
```
let bases: {int | str -> obj} = {
	1     -> 'who',
	'2nd' -> ['what'],
	1 + 2 -> { 'i' -> {'don’t' -> 'know'} },
};
bases.[-1 * -1];         %== 'who'
bases.['''{{ 2 }}nd''']; %== ['what']
bases.[3].['i'];         %== {'don’t' -> 'know'}
```

A VoidError is produced when the compiler can determine if the antecedent does not exist.
```
let a: str = '3rd';
bases.[a];          %> VoidError
```
If the compiler can’t compute the antecedent, it won’t error at all,
but this means the program could crash at runtime.
```
let unfixed a: str = '3rd';
bases.[a];                  % no compile-time error, but value at runtime will be undefined
```
We can avoid the potential crash using the
[optional access operator](./expressions-operators.md#optional-access).
```
bases?.[a]; % produces the consequent if it exists, else `null`
```
