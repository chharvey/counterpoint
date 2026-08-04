# Types
This chapter describes types of values in the Counterpoint Programming Language.

Counterpoint is a strongly-typed language, meaning that types of values are determined at compile-time.
A strong type system can help prevent many runtime errors.

Counterpoint Language Types are described in the [formal specification](../spec/types-values.md#counterpoint-language-types).
This reference takes a more informative approach.



## Value Types and Reference Types
Value types describe data that have no identity and are identifiable only by their value;
they are identical when they have the “same value”.
When a data value is assigned to a variable or parameter, a copy of it is assigned;
all value types are immutable.
An instance of a value type is called a “data value”.

Reference types describe objects that have an identity and are identifiable by reference;
they are identical when they have the same reference.
When a reference object is assigned to a variable or parameter, a new reference to the object is assigned,
and any change to the object is observable in every reference.
An instance of a reference type is called a “reference object” or simply an “object”.



## Simple Types
Simple types are individual basic types. They cannot be broken up into smaller types.


### `nothing`
Type `nothing` is at the bottom of the type hierarchy —
it contains no values and is a subtype of every other type.

Type `nothing` is used to describe the return type of functions that never return,
or the type of an expression that never evaluates.

Type `nothing` is most commonly a result of a type operation that produces the Bottom type,
for example, the intersection of two disjoint types.


### `anything`
Type `anything` is at the top of the type hierarchy —
it contains every value and expression, and is a supertype of every other type.

Type `anything` is used to describe a value or expression about which nothing is known.
Therefore, the compiler will not assume it has any properties or is valid in some operations.

### `null`
Type `null` has exactly one value, also called `null`.
The meaning of the `null` value is not specified, but it’s most commonly used as a placeholder
when no other value is appropriate.


### `bool`
Type `bool` has two logical values, called `true` and `false`.
These values are used for binary states.


### `sym`
Type `sym` contains symbols, which are values defined by the programmer.
Symbol values can only be referenced by name, as their implementations are unexposed.
Syntactically, symbol names are identifier names, preceeded by an `@`-sign (**U+0040 COMMERCIAL AT**).
```
val greeting: sym = @hello;
```

The only operations available to symbols are identity/equality
and the logical operators (‘not’, ‘and’, ‘or’, and the ternary conditional).
Symbols that have the same name are identical (and thus equal), and vice versa.
Symbols have no intrinsic meaning, or any other valid operators or methods;
their semantics may be specified by the programmer who defines them.
```
% Symbols are always truthy and non-empty.
!greeting;                        %== false
?greeting;                        %== false
greeting && @world;               %== @world
greeting || @world;               %== greeting
if greeting then "yes" else "no"; %== "yes"

% Symbols are identical, and equal, by name (case-sensitive).
greeting === @hello; %== true
greeting ==  @hello; %== true
@world   === @world; %== true
@world   ==  @world; %== true
@world   !=  @WORLD; %== true
```

Symbols differ from strings in that their implementations are hidden.
Internally, symbols are represented as integers at runtime,
but we are never exposed to their values.
We cannot operate and compute with symbols the same way we do with strings or integers.
```
val mut el: sym = @fire;
% Writable variables of type `sym` may be reassigned,
set el = @air;
set el = @aether;

% but only to symbol values!
set el = 42;         %> TypeError
set el = "a string"; %> TypeError
set el = @my_symbol; % ok

@water + @fire;        %> TypeError
@water.toUpperCase.(); %> TypeError

% One may wish to use a union type (more narrow than `sym`) to enumerate allowed symbol values.
val mut element: @water | @earth | @fire | @air = @water;
set element = @aether; %> TypeError
set element = @fire;   % ok
```

Symbols serve as keys for records and dicts in the same way that integers serve as indices for tuples and lists.
Thus, symbol values are used for dynamic access of properties at runtime,
and comparing symbols is much more efficient than comparing strings.
See [Dict Access](#dict-access) for details.

The name of a symbol may be enclosed in single-quotes (`'` **U+0027 APOSTROPHE**),
just like [Unicode identifiers](./variables.md#unicode-identifiers).
However, this is not recommended as it greatly decreases code readability.
Like Unicode identifiers, symbol names are *not* cooked, meaning escape sequences do not exist.
Stringifying a symbol produces its name.
```
val greeting1: sym = @'¡héllö wôrld!';

@'$5.99' != @'\u{24}5\u{2e}99'; %== true

val greeting2: sym = @hello_world;
greeting2 !== @'hello_world';      %== true

"""{{ greeting2 }}"""          == "hello_world";           %== true
"""{{ greeting1 }}"""          == "'¡héllö wôrld!'";       %== true % notice the single-quotes are included
"""{{ @'\u{24}5\u{2e}99' }}""" == """'\u{24}5\u{2e}99'"""; %== true % escape sequences are raw
```


### `int`
Type `int` contains whole numbers, their negatives, and zero.

Integers are written as a series of digits, such as `0123`,
optionally preceded by a negative sign (`-0123`).
`0` and `-0` are identical.

Integers may be written in six other bases in addition to the default base 10:
bases 2, 4, 6, 8, 16, and 36.

Source     | Radix | Mathematical Value (in decimal)
------     | ----- | -------------------------------
`42`       | 10    | 42
`\d42`     | 10    | 42
`\b101010` |  2    | 42
`\q222`    |  4    | 42
`\s110`    |  6    | 42
`\o52`     |  8    | 42
`\x2a`     | 16    | 42
`\z16`     | 36    | 42

The underscore may be used as a numeric separator symbol, to visually group digits.
```
\b1_0011_1000_1000;
\q103_2020;
\s3_50_52;
\o11_610;
\d5_000;
\x13_88;
\z3_u_w;
```
The numeric separator cannot appear at the beginning or end of an integer,
nor can it appear consecutively.

Integers can be added, subtracted, and multiplied like normal numbers.
However, when dividing integers, if getting a non-integer value, the fractional part is truncated
(round towards zero). Dividing by zero is an error.
In all operations on integers, bases can be mixed.
```
3 / 2;        %== 1
-3 / 2;       %== -1
\b110 * \q12; %== 36
```


### `nat`
Type `nat` contains whole numbers and zero.

Naturals are written as a series of digits following a `+` sign, such as `+0123`.
As with the Integers, Naturals may also be written in six other bases:
2, 4, 6, 8, 16, and 36, and may contain underscores usd as separators.

Naturals can be added and multiplied like normal numbers.
Division of naturals behaves the same way as with Integers, rounding towards zero. Dividing by zero is an error.
When subtracting naturals, if getting a negative value, the result is always zero.
In all operations on naturals, bases can be mixed.
```cpl
+3 / +2;        %== +1
+5 - +8;        %== +0
+\b110 * +\q12; %== +36
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


### `str`
Type `str` represents textual data.

A “raw string” is the code written to construct the string, whereas
the “cooked string” is the actual string value.
“Cooking” is the process of transforming a raw string into its value,
which follows certain rules based on the kind of string.

There are two kinds of strings: string literals and string templates.

#### String Literals
String literals are static and known at compile-time.
They’re delimited with double-quotes (`"` **U+0022 QUOTATION MARK**).
```
val greeting: str = "Hello, world!";
```

String literals may contain line breaks, which are preserved during “cooking”.
```
val pangram: str = "The quick brown fox
jumps over the lazy dog.";
```
> "The quick brown fox\
jumps over the lazy dog."

##### Line Continuations
**Line continuations** let us hard-wrap long strings into several lines
in source code, without rendering the line breaks in the strings’ cooked values.
When we escape the line break with a backslash (`\` **U+005C REVERSE SOLIDUS**),
the line break is converted into a space.
```
val pangram: str = "The quick brown fox\
jumps over the lazy dog.";
```
> "The quick brown fox jumps over the lazy dog."

##### Escaping Characters
Some characters are not allowed in string literals, and others are not easily typed.
The following special characters may be escaped:

Raw Input | Output Character     | Output Code
--------- | -------------------- | ------------
`\"`      | QUOTATION MARK       | U+0022
`\\`      | REVERSE SOLIDUS      | U+005C
`\%`      | PERCENT SIGN         | U+0025
`\s`      | SPACE                | U+0020
`\t`      | CHARACTER TABULATION | U+0009
`\n`      | LINE FEED (LF)       | U+000A
`\r`      | CARRIAGE RETURN (CR) | U+000D
`\u{24}`  | DOLLAR SIGN          | U+0024

The code `\"` prints a literal quotation mark character without closing the string,
and `\\` prints a literal backslash character without escaping the following one.
```
"I am using quotes: I love \"strings\"!";
"I am using backslashes: I love \\nighttime coding\\!";
```
> "I am using quotes: I love "strings"!"
>
> "I am using backslashes: I love \nighttime coding\\!"

(Note that the code `\nighttime` would have been cooked as a line feed followed by “ighttime”,
since `\n` is the line feed character.)

The code `\%` prints a literal percent sign without initiating an [in-string comment](#in-string-comments).
```
"The 10\% discount was not enough.";
```
> "The 10% discount was not enough."

The code `\u{‹codepoint›}` escapes unicode characters,
where ‹codepoint› is the code point of the character in hexadecimal.
For example, `\u{24}` escapes the dollar sign symbol, since its code point is **U+0024**.
```
val price: str = "\u{24}3.99";
```
> "$3.99"

This is useful for writing non-ASCII characters in code.
```
"I\u{2019}m happy! \u{1_f600}";
```
> "I’m happy! 😀"

Code points must be written as any number of lowercase hexadecimal digits
intermixed with underscores `[0-9a-f_]`.
(If no code point is supplied, **U+0000 NULL** is assumed.)

Other than for the special cases listed above, a backslash has no effect.
```
"I am using escaped apostrophes: I love \'strings\'!";
"I am using unescaped apostrophes: I love 'strings'!";
"\Any non-special \character \may \be \escaped.";
```
> "I am using escaped apostrophes: I love 'strings'!"
>
> "I am using unescaped apostrophes: I love 'strings'!"
>
> "Any non-special character may be escaped."

##### In-String Comments
String literals may contain Counterpoint comments.
Line comments begin with `%` (**U+0025 PERCENT SIGN**) and continue until (but not including) the next line break, and
multiline comments begin with `%%` and continue until (and including) the next `%%`.
Both kinds of comments will continue until their end delimiter unless the end of the string is reached first.
The commented content is removed from the string’s cooked value.

-
	```
	"The five boxing wizards % jump quickly.";
	```
	> "The five boxing wizards "
-
	```
	"The five % boxing wizards
	jump quickly.";
	```
	> "The five&nbsp;\
	> jump quickly."
-
	```
	"The five %% boxing wizards %% jump quickly.";
	```
	> "The five &nbsp;jump quickly."
-
	```
	"The five %% boxing
	wizards %% jump
	quickly.";
	```
	> "The five &nbsp;jump\
	> quickly."

Multiline comments cannot be nested.
```
"The %% five %% boxing %% wizards %% jump quickly.";
```
> "The &nbsp;boxing &nbsp;jump quickly."

#### String Templates
String templates are dynamic and may contain interpolated expressions.
They’re delimited with three double-quotes (`"""`).
```
val years: int = 10;
val greeting: str = """I’ve been coding for {{ years }} years.
That’s about {{ 365 * years }} days.""";
```

##### Interpolation
String templates may contain interpolated expressions, which are enclosed within double-braces `{{ … }}`.
An interpolated expression is an expression that computes to a string.
```
val twelve: str = "12";
"""3 times 4 is {{ twelve }}""";
```
> "3 times 4 is 12"

If the type of an interpolated expression is not a string, it’s **coerced** into a string at run-time.
```
"""3 times 4 is {{ 3 * 4 }}""";
```
> "3 times 4 is 12"

If an interpolated expression is absent, the empty string is assumed.
```
"""3 times 4 is {{  }} twelve""";   %== "3 times 4 is  twelve"
"""3 times 4 is {{ "" }} twelve"""; %== "3 times 4 is  twelve"
```

Comments in interpolated expressions are ignored.
```
"""Pack {{ %% a multline comment %% }} my box
with five dozen {{ %% another
multiline comment %% "liquor" }} jugs.""";
```
> "Pack &nbsp;my box\
with five dozen liquor jugs."

Be careful with single-line comments.
```
"""Hello {{ % a line comment }} world."""; %> ParseError

"""Hello {{ % a line comment
}} world.""";                % ok
```

Comments *within* string templates are *not* ignored.
```
"""
Sphinx of black quartz,    % not a comment
judge my vow.              \% also not a comment

Sphinx of    %% also not a comment %%           black quartz,
judge        \%\% and this isn’t either \%\%    my vow.
""";
```

##### No Escapes
String templates may contain line breaks, but line continuations are not possible.
```
val pangram: str = """Watch “Jeopardy!”,\
Alex Trebek’s fun TV quiz game.""";
```
> "Watch “Jeopardy!”,\\\
Alex Trebek’s fun TV quiz game."

In fact, no character escapes are possible inside string templates.
The cooked value of a string template matches its raw code.

Probably one of the most common uses of string templates is that they can contain DSLs,
“domain-specific languages”. For example, we might want to encode a CSS snippet in a string template:
```
val css_code: str = """
	h1, h2, h3 {
		font-weight: bold;
	}
	blockquote {
		margin-left: 0.5in;
	}
""";
```
Because there are no character escapes, DSLs very easy to read and write in string templates.
```
val latex_code: str = """
	\paragraph{The following equations explain how \emph{matter} and \emph{energy} are related.}
	\begin{align}
		E_0 &= mc^2 \\
		E   &= \frac{mc^2}{\sqrt{1-\frac{v^2}{c^2}}}
	\end{align}
""";
val javascript_code: str = """
	var nonempty_string = "Look, ma, no escaping (the quotes)!"
	var empty_string = ""
""";
```

If we want to escape special characters like code points or curly braces,
we can use string interpolation.
```
"""
We can’t escape code points: \u{24} will not print a dollar sign.
But we can interpolate a string literal: {{ "\u{24}" }}.

We also can’t escape \{\{ curly_braces \}\},
but we can {{ "{{ interpolate }}" }}.

Quotes can’t be escaped either: \"\"\" will print as it looks.
But here are three, interpolated: {{ "\"\"\"" }}

I {{ "\u{2764}" }} Unicode!
"""
```
> "\
> We can’t escape code points: \u{24} will not print a dollar sign.\
> But we can interpolate a string literal: $.\
> \
> We also can’t escape \\{\\{ curly_braces \\}\\},\
> but we can {{ interpolate }}.\
> \
> Quotes can’t be escaped either: \\"\\"\\" will print as it looks.\
> But here are three, interpolated: """\
> \
> I ❤ Unicode!\
> "


### `Object`
Type `Object` is the type of all references, that is, every reference type is assignable to `Object`.
This is because all reference objects are ultimately instances of the `Object` class.



### Unit Types
Unit types are types that contain only one value.
In fact, the `null` type is already an example of a unit type! — it only holds the `null` value.
Because unit types can only hold a single constant value, they are sometimes called “constant types”,
although that term can be ambiguous in the context of generics, where types may be variable.

A unit type must be a single primitive literal, i.e., an Integer, Float, or String (and of course `null`),
and any value assignable to it must compute to that value. Variables with a unit type may still be reassignable,
but they can only be reassigned to the same value, so having a writable variable with a unit type is kind of pointless.
Variables with unit types are conventionally written in MACRO_CASE.
```
val mut TAU: true = true;
set TAU = true;
set TAU = false; %> TypeError

val mut CAR_WHEELS: 4 = 4;
val CAT_FEET: \b100 = \o4;
set CAR_WHEELS = CAT_FEET;
```

The assigned value doesn’t need to be a literal; it may be an expression,
as long as it’s computable by the compiler’s constant folding mechanism.
```
val TAU: true = !false;
val CAR_WHEELS: \b100 = \o10 / 2;
```

#### String Unit Types
Unit types may also be [strings](#str), but there are few details that should be noted.

String unit types are compared by **string value**.
This means both the type and the value are computed before the assignment takes place.
String unit types can also contain escape sequences and special characters.
```
val GREETING: "H\u{e9}llo\sW\u{f6}rld!" = "Héllo Wörld!";
val COUNT: "1
2\
3	4" = "1\n2 3\t4";
```

If the compiler can compute the value of a string template, then it may also be assigned to a string unit type.
```
val hello: str = "Hello";
val world: str = "World";
val GREETING: "Hello World!" = """{{ hello }} {{ world }}!""";
```
Notice that even though the variables `hello` and `world` are *not* declared with unit types (`str` is not a unit type),
the compiler is still able to compute their values, thus the assignment to `GREETING` is valid.
However, if they were writable, that wouldn’t be possible.
```
val mut hello: str = "Hello";
val mut world: str = "World";
val GREETING: "Hello World!" = """{{ hello }} {{ world }}!"""; %> TypeError
```
This is because the type of the template can only be inferred as `str`,
which is wider than the unit type it’s being assigned to.

String templates *cannot* be used as unit types (even if they’re templates without interpolation).
```
val GREETING: """Hello World!""" = "Hello World!"; %> ParseError
```



## Compound Types
Compound types are composed of other types.

Type               | Size     | Indices/Keys        | Generic Type Syntax | Explicit Type Syntax                 | Constructor Syntax                           | Literal Syntax                         | Empty Literal Syntax
------------------ | -------- | ------------        | ------------------- | ------------------------------------ | -------------------------------------------- | -------------------------------------- | --------------------
[Tuple](#tuples)   | Fixed    | integers & naturals | *(none)*            | `(str, str, str)`<sup>&lowast;</sup> | *(none)*                                     | `("x", "y", "z")`<sup>&lowast;</sup>   | `()`
[Record](#records) | Fixed    | symbols             | *(none)*            | `(a: str, b: str, c: str)`           | *(none)*                                     | `(a= "x", b= "y", c= "z")`             | *(none)*
[List](#lists)     | Variable | integers & naturals | `List.<str>`        | `[str]`                              | `List.(("x", "y", "z"))`                     | `["x", "y", "z"]`                      | `[]`
[Dict](#dicts)     | Variable | symbols             | `Dict.<str>`        | `[:str]`                             | `Dict.((a= "x", b= "y", c= "z"))`            | `[a= "x", b= "y", c= "z"]`             | *(none)*
[Set](#sets)       | Variable | *(none)*            | `Set.<str>`         | `{str}`                              | `Set.(("x", "y", "z"))`                      | `{"x", "y", "z"}`                      | `{}`
[Map](#maps)       | Variable | objects             | `Map.<str, str>`    | `{str -> str}`                       | `Map.((("u", "x"), ("v", "y"), ("w", "z")))` | `{"u" -> "x", "v" -> "y", "w" -> "z"}` | *(none)*


### Tuples
Tuples are fixed-size ordered lists of indexed values, with indices starting at *0*.
The values in a tuple are called **items** (the actual values) or **entries** (the “slots” where values are stored).
The number of entries in a tuple is called its **count**.
The count of a tuple is fixed and known at compile-time, as is the type of each entry in it.
The order of entries is significant: looping and iteration are performed in index order.
Tuples are heterogeneous, meaning they can be declared with different entry types.
They are also read-only, which means their entries cannot be added, deleted, or reassigned.

For example, the tuple `(3, 4.0, "seven")` has an integer in the first position at index `0`,
followed by a float at index `1`, followed by a string at index `2`. Its count is *3*.

Tuple literals are comma-separated expressions within parentheses.
Tuple types use the same syntax, but instead of value expressions
they contain type expressions (a.k.a. types).
```
val elements: (str, str, str) = ("earth", "wind", "fire");
```
<sup>&lowast;</sup>Note: A tuple type or expression with exactly 1 entry must have either a leading or trailing comma,
so as not to be confused with a grouped expression/type.
I.e., `(T)` is just a parenthesized type, whereas `(T,)` is a 1-tuple type.

```
val element:   (str)  = "air";
val singleton: (str,) = ("air",);
```

Larger tuples are always assignable to smaller tuples,
but assigning a smaller tuple to a larger tuple results in a TypeError.
```
val elements: (str, str, str) = ("earth", "wind", "fire", true, 42);
val elements_and_more: (str, str, str, bool, int) = ("earth", "wind", "fire"); %> TypeError
```
The first declaration is allowed because the last two items are simply dropped off.

Because tuples are read-only, the `mut` operator is invalid on tuple types.
```
val elements: mut (str, str, str) = ("earth", "wind", "fire"); %> TypeError
```

#### Tuple Access
Items of a tuple can be accessed via 0-based **dot-accessor notation**
(index `0` represents the first item).
```
val elements: (str, str, str) = ("earth", "wind", "fire");
elements.0; %== "earth"
elements.1; %== "wind"
elements.2; %== "fire"
```

Since tuples have integral indices, we can use other bases:
```
elements.\b01; %== "wind"
elements.\b10; %== "fire"
```

We can also access by natural number index.
```cpl
elements.+1;    %== "wind"
elements.+\b10; %== "fire"
```

Tuple size is known at compile-time,
so attempting to retrieve an out-of-bounds index results in a compile-time error.
Positive indices beyond the end of the list result in a TypeErrorNoEntry.
The indices *do not* loop around.
```
elements.3; %> TypeErrorNoEntry
```

A tuple’s items, type, and size are all fixed.
```
val tuple: (bool, int, str) = (true, 4, "hello");
set tuple.0 = false;   %> MutabilityError
set tuple.1 = 2;       %> MutabilityError
set tuple.2 = "world"; %> MutabilityError
tuple; %== (true, 4, "hello");
```

#### Optional Items
Tuple types may have optional items, indicating that a tuple of that type might or might not have that item.
```
val mut x: (str, int, ?: bool) = ("hello", 42);
set x = ("hello", 42, true);
```
The symbol `?:` in the type signature indicates that the item is optional.
In a tuple type, all optional items *must* come after all required items.

Use the [maybe access operator](./expressions-operators.md#maybe-access) `?.` to access optional tuple entries.
```
val x2: bool? = x?.2;
```
If `x.2` exists, the expression `x?.2` produces that value; otherwise it produces `null`.


### Records
Records are fixed-size unordered lists of keyed values. Key–value pairs are called **properties**,
where **keys** are keywords or identifiers, and **values** are expressions.
The number of properties in a record is called its **count**.
The count and types of record **entries** (the “slots” where values are stored) are fixed and known at compile-time.
The order of entries is *not* significant: though records can be iterated over, the order in which this is done is
implementation-dependent; thus authors should not rely on any particular iteration order.
Records are heterogeneous, meaning they can be declared with different entry types.
They are also read-only, which means their entries cannot be added, deleted, or reassigned.

For example, the record
```
(
	fontFamily= "sans-serif",
	fontSize=   1.25,
	fontStyle=  "oblique",
	fontWeight= 400,
);
```
has a count of 4.

Keys may be reserved keywords, not just restricted to identifiers.
This is because the record key will always be lexically bound to the record —
it will never stand alone, so there’s no risk of syntax error.
```
(
	type=  "to initialize a variable",
	is=    "referential identity",
	int=   "the Integer type",
	false= "the negative boolean value",
);
```
Conventionally, whitespace is omitted between the key name and the equals sign delimiter `=`.
This practice helps programmers differentiate between record properties and variable declarations/assignments.

Record literals cannot contain the same key more than once.
```
(
	fontFamily= "sans-serif",
	fontSize=   1.25,
	fontFamily= "serif",      %> AssignmentError
);
```
> AssignmentError: Duplicate record/dict key: `fontFamily` is already set.

Record literal types are similar to record values, except that the colon `:` is used as the key–value delimiter,
and the property values are replaced with types.
```
type StyleMap = (
	fontWeight: int,
	fontStyle:  "normal" | "italic" | "oblique",
	fontSize:   float,
	fontFamily: str,
);
val my_styles: StyleMap = (
	fontFamily= "sans-serif",
	fontSize=   1.25;
	fontStyle=  "oblique",
	fontWeight= 400,
);
```
Notice how the properties may be written out of order. Records are famous for being order-independent,
and we should not assume that any looping or iteration over a record is performed in any particular order.
However, *code evaluation* is always left-to-right and top-to-bottom, which means that if any entries
cause any side-effects, those side-effects will be observed in the order the entries are written.
(This is significant if any values are function calls for example.)

Larger records are always assignable to smaller records,
but assigning a smaller record to a larger record results in a TypeError.
```
val elements: (
	socrates:  str,
	plato:     str,
	aristotle: str,
) = (
	socrates=   "earth",
	euclid=     true,
	plato=      "wind",
	pythagoras= 42,
	aristotle=  "fire",
);

val elements_and_more: (
	socrates:   str,
	plato:      str,
	aristotle:  str,
	euclid:     bool,
	pythagoras: int,
) = (
	socrates=  "earth",
	plato=     "wind",
	aristotle= "fire",
); %> TypeError
```
The first declaration is allowed because the unused properties are simply dropped off.

Because records are read-only, the `mut` operator is invalid on record types.
```
val elements: mut (x: str, y: str, z: str) = (x= "earth", y= "wind", z= "fire"); %> TypeError
```

#### Record Access
Values of a record can be accessed via **dot-accessor notation**.
```
val elements: (
	socrates:  str,
	plato:     str,
	aristotle: str,
) = (
	socrates=  "earth",
	plato=     "wind",
	aristotle= "fire",
);
elements.socrates;  %== "earth"
elements.plato;     %== "wind"
elements.aristotle; %== "fire"
```

Record keys are known at compile-time,
so attempting to retrieve an non-existent key results in a compile-time error.
```
elements.pythagoras; %> TypeErrorNoEntry
```

A record’s properties, type, and size are all fixed.
```
val record: (a: bool, b: int, c: str) = (a= true, b= 4, c= "hello");
set record.a = false;   %> MutabilityError
set record.b = 2;       %> MutabilityError
set record.c = "world"; %> MutabilityError
record; %== (a= true, b= 4, c= "hello");
```

#### Optional Properties
Record types may have optional properties, indicating that a record of that type might or might not have that property.
```
val mut y: (firstname: str, middlename?: str, lastname: str) = (
	firstname= "Martha",
	lastname=  "Dandridge",
);
set y = (
	firstname=  "Martha",
	lastname=   "Washington",
	middlename= "Dandridge",
);
```
The symbol `?:` in the type signature indicates that the property is optional.
In a record type, required and optional properties may be intermixed (order isn’t enforced).

Use the [maybe access operator](./expressions-operators.md#maybe-access) `?.` to access optional record entries.
```
val ym: str? = y?.middlename;
```
If `y.middlename` exists, the expression `y?.middlename` produces that value; otherwise it produces `null`.


### Lists
Lists are variable-size ordered lists of indexed values, with indices starting at *0*.
The values in a list are called **items** (the actual values) or **entries** (the slots the values are stored in).
The number of entries in a list is called its **count**; the count of a list is variable and unknown at compile-time.
Lists are homogeneous, meaning all entries in the list have the same type (or parent type).
If a list is mutable, the entries of the list may be reassigned, and items may be added and removed from the list as well.

List types are declared via the generic list type syntax: `List.<T>`
where `T` indicates the type of items in the list.
Lists are constructed via the constructor syntax `List.<T>(arg)`,
where `arg` is a [Tuple](#tuples) object.
```
val elements: List.<str> = List.<str>(("earth", "wind", "fire"));
```
A shorthand for the generic syntax `List.<T>` is `[T]`,
and the list literal shorthand syntax is a sequence of comma-separated expressions within square brackets.
We can mix item types, but the list type must be homogeneous.
```
val elements: [str | bool | int] = ["earth", "wind", "fire", true, 42];
```
The compiler considers all items in the list as having the same type.
For example, the expression `elements.[0]` is of type `str | bool | int`,
and if the list were mutable, we could reassign that entry to an integer or boolean.

#### List Access
List items are accessed by **bracket-accessor notation**, where the expression in brackets computes the index.
The bracketed expression must be an Integer or Natural value (of type `int` or `nat`).
```
val elements: [str] = ["earth", "wind", "fire"];
elements.[0];       %== "earth"
elements.[+3 - +2]; %== "wind"
elements.[-3 + 2];  %== "fire"
elements.[0.5 * 2]; %> TypeError % expected int but found float
```

Negative indices count backwards from the end of the list.
Index `-1` represents the last item, index `-2` represents the penultimate item, etc.
```
elements.[-1];    %== "fire"
elements.[-\b10]; %== "wind"
```

When the the compiler can determine if the index is out-of-bounds (for example if the list and index are foldable),
then a VoidErrorOutOfBounds is reported at compile-time.
(This differs from a tuple, where a TypeErrorNoEntry would be reported.)
Indices *do not* loop around. Negative indices can not be less than the negative count.
```
val mut i: int = 4;
elements.[i];   %> VoidErrorOutOfBounds
set i = -4;
elements.[i];   %> VoidErrorOutOfBounds
```
Most lists are dynamic and their count is unknown by the compiler, so we won’t always be warned when the index is out of bounds.
In these cases, the typer will still analyze the expression, but an ExceptionIndexOutOfBounds is thrown at runtime.
```
val mut i: int = 4;           % writable variables are not folded
val elem: str = elements.[i]; % no compile-time error, but results in ExceptionIndexOutOfBounds
```

The [maybe access operator](./expressions-operators.md#maybe-access) will “catch” the exception and return `null` instead.
```
elements?.[i]; %== null
```


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
val my_styles: Dict.<int | float | str> = Dict.<int | float | str>((
	fontFamily= "sans-serif",
	fontSize=   1.25,
	fontStyle=  "oblique",
	fontWeight= 400,
));
```
A shorthand for the generic syntax `Dict.<T>` is `[:T]`,
and the dict literal shorthand syntax is a sequence of comma-separated `key= value` pairs within square brackets.
As shown above, we can mix value types, but the dict type must be homogeneous.

Dict literals cannot contain the same key more than once.
```
[
	fontFamily= "sans-serif",
	fontSize=   1.25,
	fontFamily= "serif",      %> AssignmentError
];
```
> AssignmentError: Duplicate record/dict key: `fontFamily` is already set.

#### Dict Access
Dict properties are accessed by **bracket-accessor notation**, where the expression in brackets computes the key.
The bracketed expression should be a Symbol value (of type `sym`).
```
val elements: [: str] = [
	socrates=  "earth",
	plato=     "wind",
	aristotle= "fire",
];
elements.[@socrates]; %== "earth"

val key: sym = if user.hasPermissions then @plato else @aristotle;
elements.[key]; % either "wind" or "fire" depending on `user.hasPermissions`
elements.[2];   %> TypeError % expected sym | str but found int
```
A string *may* be given as an argument if the symbol name is not known ahaed of time.
This method is not recommended, but is sometimes necessary,
e.g., if we are parsing and accessing JSON data at runtime.
In this case, the VM will compare the given string’s value with each of the dict’s keys’ stringified values.
```
claim json_data: [: str];
json_data.["aristotle"];                   % valid, but slower than giving a symbol
json_data.["so-crates".replace.("-", "")]; % computed strings may be given
```

When the the compiler can determine if the key is out-of-range (for example if the dict and key are foldable),
then a VoidErrorOutOfBounds is reported at compile-time.
(This differs from a record, where a TypeErrorNoEntry would be reported.)
```
val s: sym = @pythagoras;
elements.[s];             %> VoidErrorOutOfBounds
```
Most dicts are dynamic and their range of keys is unknown by the compiler, so we won’t always be warned when the key is out of range.
In these cases, the typer will still analyze the expression, but an ExceptionKeyOutOfRange is thrown at runtime.
```
val mut s: sym = @pythagoras; % writable variables are not folded
elements.[s];                 % no compile-time error, but results in ExceptionKeyOutOfRange
json_data.["pythagoras"];     % no compile-time error, but results in ExceptionKeyOutOfRange
```

The [maybe access operator](./expressions-operators.md#maybe-access) will “catch” the exception and return `null` instead.
```
json_data?.["pythagoras"]; %== null
```


### Sets
Sets are variable-sized unordered lists of values.
The values in a set are called **elements**. The number of elements in a set is called its **count**.

Set types are declared via the generic set type syntax: `Set.<T>`
where `T` indicates the type of elements in the set.
Sets may be constructed via the constructor syntax `Set.<T>(arg)`,
where `arg` is a [Tuple](#tuples) object of elements.
```
val elements: Set.<str> = Set.<str>(("earth", "wind", "fire"));
```
The set above has elements of one type.
Typically this will be the case, but it’s possible for a set to contain a mix of different element types.

A shorthand for the generic syntax `Set.<T>` is `{T}`,
and the set literal shorthand syntax is a sequence of comma-separated expressions within curly braces.
```
val elements: {str} = {"earth", "wind", "fire"};
```

The size of sets is not known at compile-time, and could change during run-time.
For example, a program could add an element to the above set after it’s been declared, changing its count.
The order of elements in a set is not necessarily significant.

Sets cannot contain identical elements (elements that are “the same object”).
If a set is declared with duplicates, they are collapsed:
The set `{"water", "water"}` only conains 1 element.
Sets may have several elements that are un-identical but “equal”.
```
val x: [str] = ["water"];
val y: [str] = ["water"];
val elements: {float | [str]} = {0.0, -0.0, x, y};
```
In this example, the elements `0.0` and `-0.0` are not identical
(even if they are equal by the floating-point definition of equality).
Similarly, `x` and `y` are not identical, but they are equal by list composition.
Even though `0.0 == -0.0` and `x == y`, this set has four elements.

#### Set Access
Elements of a set can be accessed via **bracket-accessor notation**,
where the expression in the brackets is the element to get.
The value is `true` if the element is in the set, and `false` if not.
```
val bases: {anything} = {
	"who",
	["what"],
	{ "i" -> {"don’t" -> "know"} },
};
bases.["""{{ "w" }}{{ "h" }}{{ "o" }}"""]; %== true
bases.[["what"]];                          %== false
bases.["idk"];                             %== false
```

A TypeError is produced when the expression is not assignable to the set’s type argument.
```
val a: int = 3;
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
where `arg` is a [Tuple](#tuples) object of key-value pairs (also Tuples).
```
val bases: Map.<int | str, anything> = Map.<int | str, anything>((
	(1,     "who"),
	("2nd", ("what",)),
	(1 + 2, { "i" -> {"don’t" -> "know"} }),
));
```
The map above has antecedents and consequents of various types.
Typically, all the antecedents will be of one type and all the consequents will be of one type,
but this isn’t a requirement.

A shorthand for the generic syntax `Map.<K, V>` is `{K -> V}`,
and the map literal shorthand syntax is a sequence of comma-separated `key -> value` pairs within curly braces.
```
val bases: {int | str -> anything} = {
	1     -> "who",
	"2nd" -> ("what",),
	1 + 2 -> { "i" -> {"don’t" -> "know"} },
};
```

The size of maps is not known at compile-time, and could change during run-time.
For example, a program could add a case to the above map after it’s been declared, changing its count.
Like records, the order of entries in a map is not necessarily significant.

Antecedents have unique consequents in that latter declarations take precedence.
In the case of maps, antecedents that are identical are considered “the same object”.
```
val bases: {int | str -> anything} = {
	1     -> "who",
	"2nd" -> ("what",),
	1 + 2 -> { "i" -> {"don’t" -> "know"} },
	4 - 1 -> (i= ('don’t'= "know")),
};
```
The consequent corresponding to the antecedent `3` will be `` (i= ('don’t'= "know")) ``.

Maps may have several antecedents that are un-identical but “equal”.
```
val x: {int} = {3};
val y: {int} = {3};
val bases: {float | {int} -> anything} = {
	0.0  -> "who",
	-0.0 -> ("what",),
	x    -> { "i" -> {"don’t" -> "know"} },
	y    -> (i= ('don’t'= "know")),
};
```
In this example, the antecedents `0.0` and `-0.0` are not identical
(even if they are equal by the floating-point definition of equality).
Thus we are able to retrieve the different consequents at each of those antecedents.
Similarly, `x` and `y` are not identical, but they are equal by Set composition.
Even though `0.0 == -0.0` and `x == y`, this map has four entries.

#### Map Access
Consequents of a map can be accessed via **bracket-accessor notation**,
where the expression in the brackets is the antecedent to get.
```
val bases: {int | str -> anything} = {
	1     -> "who",
	"2nd" -> ("what",),
	1 + 2 -> { "i" -> {"don’t" -> "know"} },
};
bases.[-1 * -1];         %== "who"
bases.["""{{ 2 }}nd"""]; %== ("what",)
bases.[3].["i"];         %== {"don’t" -> "know"}
```

A VoidErrorOutOfBounds is produced when the compiler can determine if the antecedent does not exist.
```
val a: str = "3rd";
bases.[a];          %> VoidErrorOutOfBounds
```
If the compiler can’t compute the antecedent, it won’t error at all,
but this means an Exception could be thrown at runtime.
```
val mut a: str = "3rd";
bases.[a];              % no compile-time error, but runtime exception
```
We can avoid the potential crash using the
[maybe access operator](./expressions-operators.md#maybe-access).
```
bases?.[a]; % produces the consequent if it exists, else `null`
```



## Control Abstraction Types


### Maybes
Maybe objects are containers of possible values.
The Maybe type is an abstract type with exactly two concrete subtypes: Some, which contains a value, and None, which contains no value.
Maybe objects are used for representing optional variables/parameters/entries, and in general, any value that might or might not exist.

Maybe types are declared via the **generic maybe type syntax**: `Maybe[T]`
where `T` indicates the type of the possible value.
`T` may be any type, including a type unioned with Null or even another Maybe type. Nested Maybe types do not flatten.
Some and None objects are constructed via the constructor syntaxes `Some[T](value)` and `None[T]()` respectively.
```cpl
val mut x: Maybe[int] = Some[int](42);
set x = None[int]();
```

A shorthand for the generic syntax `Maybe[T]` is `T?`.
```cpl
val mut x: int? = Some[int](42);
set x = None[int]();
```

The [maybe access operator](./expressions-operators.md#maybe-access) works very well with the Maybe type.
