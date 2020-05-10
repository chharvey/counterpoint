# Variables
This chapter describes declaring and referencing variables.



## Variable Declaration
Values in Solid can be stored in variables and then referenced later.
In order to use a variable, it must be **declared** first.
We declare variables with he keyword `let`.
```
let my_var = 'Hello, world!';
```
When we declare a variable, we must assign it a value, using the **assignment operator** `=`.
In some languages, declaring a variable and at the same time assigning it a value is called **initialization**.
In Solid, this is mandatory — it’s not possible to declare a value without initializing it.
The assignment operator is an equals sign, but it does not represent equality in the mathematical sense.
It means we’re setting the value on the right-hand side to the variable on the left.
In programming terms, we say, “the variable `my_var` is **assigned the value** `'Hello, world!'`”,
or, “the value `'Hello, world!'` is **assigned *to* the variable** `my_var`”.

When we access the variable, we reference the value it’s assigned.
```
my_var; %== 'Hello, world!'
```

All **basic** variable names *must* start with an uppercase or lowercase letter or an underscore.
The rest of the basic variable name may include letters, digits, and underscores.
By convention, variables are named in *snake_case*, but it’s not required.
Variable names don’t have to be “basic” — we can write variables with
[Unicode characters](#unicode-identifiers) as well.


### Temporal Dead Zone
Attempting to access an undeclared variable results in a compile-time error:
```
my_other_var; %> ReferenceError
```
> ReferenceError: `my_other_var` is not declared.

Even if the variable is declared further down in the code, we get the same error.
This region of code between where a variable is accessed and where it’s declared
is called a **temporal dead zone**.
Solid does not hoist variables.
```
my_other_var;              %> ReferenceError
{%------------------------
--- TEMPORAL DEAD ZONE ---
------------------------%}
let my_other_var = 'Hello, programmer!';
```
> ReferenceError: `my_other_var` is not declared.



## Variable Reassignment
When a variable is declared with `let unfixed`, its pointer may change to a new value.
```
let unfixed my_var = 'Hello, world!';
my_var;                               %== 'Hello, world!'
my_var = '¡Hola, mundo!';
my_var;                               %== '¡Hola, mundo!'
```

Changing the values of variables is useful in some cases, such as for storing state,
but in some programming disciplines this pattern is generally not encouraged.
Variables holding holding different values at different points in runtime
could lead to unpredictability.

Therefore, we can declare a variables without the keyword `unfixed`.
Such variables are **fixed**: they cannot be reassigned.
```
let my_var = 'Hello, world!';
my_var = '¡Hola, mundo!';     %> AssignmentError
```
> AssignmentError: Reassignment of a fixed variable: `my_var`.


### Pointers
Variables are pointers, which reference preexisting values.
When we reference a variable, we access the value that it points to.
```
let my_var = 'Hello, world!';
my_var;                       % references the string `'Hello, world!'`
```

Pointers are static.
When a variable is assigned another variable, it points to the evaluated value of that variable.
```
let a = 42;
let b = a;
a;          %== 42
b;          % also `42`
```
If that first variable is ever reassigned, the second variable will keep its pointer
to the original value, until it itself is reassigned.
```
let unfixed a = 42;
let unfixed b = a;
a;                  %== 42
b;                  % also `42`
a = 420;
a;                  % now `420`
b;                  % still `42`
```



## Unicode Identifiers
Identifiers exist to name variables, among other programming constructs.
**Basic identifiers** take the form `[A-Za-z_][A-Za-z0-9_]*`,
that is, a single upper- or lower-case letter or underscore, followed by any number of
upper- or lower-case letters, digits, and underscores.

This constraint is quite limited and could be a pain point for non-English speakers.
Many other languages have characters in their alphabet that are not allowed by this rule.
Therefore, Solid offers a flexible mechanism for allowing identifiers with
almost any character in the Unicode character set: **Unicode identifiers**.

By wrapping the identifier name with back-ticks (`` ` ` `` **U+0060 GRAVE ACCENT**),
we can include non-ASCII letters.
```
let `español` = 'Spanish for “Spanish”';
```
In the identifier above, notice the letter `ñ` (**U+00F1 LATIN SMALL LETTER N WITH TILDE**).
We can access the variable just like any other, as long as we include the name in back-tick delimiters.
```
`español`; %== 'Spanish for “Spanish”'
```

When an identifier is declared with back-ticks, it must always be accessed as such,
even if it doesn’t contain “special characters”. The converse is true as well.
```
let `foo` = 42;
foo * 2;        %> ReferenceError
let bar = 420;
`bar` * 2;      %> ReferenceError
```
> ReferenceError: `foo` is not declared.
>
> ReferenceError: `` `bar` `` is not declared.

With Unicode identifiers, we can insert almost any character,
including spaces and punctuation symbols.
```
let `Svaret på den ultimata frågan.` = 42;
`Svaret på den ultimata frågan.` / 2;      %== 21
```
Note that Unicode identifiers *are not strings*; they’re simply names of declared variables.
Even though Unicode identifiers are not strings, they’re tokenized the same way
that template literals are, with a few differences.

Like template literals,

- Unicode identifiers are not “cooked”, so there are no escape sequences.
	That is, an identifier named `` `1\u{24}2` `` remains exactly as typed;
	it does not become `` `1$2` `` and cannot be accessed as such.
	`` `1\u{24}2` `` and `` `1$2` `` are two different identifiers.
- Line breaks are allowed in Unicode identifiers,
	however, keep in mind that this might result in very unreadable code.
- The character **U+0003 END OF TEXT** is not allowed in Unicode identifiers
	(or any token for that matter) and will cause a lexical error.

But unlike template literals,

- Unicode identifiers may contain the character sequences `'''` and `{{` in them,
	since they are not delimited by those characters.
- Unicode identifiers must not contain the character `` ` `` **U+0060 GRAVE ACCENT**,
	as that would end the token. There is no way to escape this character.
