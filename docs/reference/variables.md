# Variables
This chapter describes declaring and accessing local variables and types.



## Variable Declaration
Values in Counterpoint can be stored in variables and then accessed later.
In order to use a variable, it must be **declared** first,
in what we call a **variable declaration statement**.
We declare variables with the keyword `let`.
```
val my_var: str = "Hello, world!";
```
When we declare a variable, we must assign it a value, using the **assignment operator** `=`.
In some languages, declaring a variable and at the same time assigning it a value is called **initialization**.
In Counterpoint, this is mandatory — It’s not possible to declare a value without initializing it.
The assignment operator is an equals sign, but it does not represent equality in the mathematical sense.
It means we’re setting the value on the right-hand side to the variable on the left.
In programming terms, we say, “the variable `my_var` is **assigned the value** `"Hello, world!"`”,
or, “the value `"Hello, world!"` is **assigned *to* the variable** `my_var`”.

When we access the variable, we reference the value it’s assigned.
```
my_var; %== "Hello, world!"
```

Variables can be declared only once within a given scope.
Attempting to declare a new varible with the same name will result in a semantic error.
```
val my_var: str = "Hello, world!";
val my_var: str = "¡Hola, mundo!"; %> AssignmentError
```
> AssignmentError: Duplicate declaration: `my_var` is already declared.

All **basic** variable names *must* start with an uppercase or lowercase letter or an underscore.
The rest of the basic variable name may include letters, digits, and underscores.
By convention, unbound variables are named in *snake_case*.
Basic variable names cannot be any of the reserved keywords in Counterpoint.
Variable names don’t have to be “basic” — we can write variables with
[Unicode characters](#unicode-identifiers) as well.

There exists a uniquely special variable in Counterpoint, `_`,
which has a reserved meaning, discussed [below](#the-blank-identifier).


### Temporal Dead Zone
Attempting to access an undeclared variable results in a compile-time error:
```
my_other_var; %> ReferenceError
```
> ReferenceError: `my_other_var` is never declared.

Even if the variable is declared further down in the code, we get the same error.
This region of code between where a variable is accessed and where it’s declared
is called a **temporal dead zone**.
Counterpoint does not hoist variables.
```
my_other_var;              %> ReferenceError
%%------------------------
--- TEMPORAL DEAD ZONE ---
------------------------%%
val my_other_var: str = "Hello, programmer!";
```
> ReferenceError: `my_other_var` is used before it is declared.


### Type Inference
When assigning a variable a primitive literal, string template, or constructor call (with no operations),
we can omit the type annotation.
For read-only variables, the type is inferred as a unit type containing that primitive value.
For writable variables, the inferred type is the narrowest primitive type corresponding to that value.
For string template values (with or without interpolation), the inferred type is always `str`.
Constructor calls always imply their exact type (made mutable if applicable).
```cpl
val     untyped         = 11; % type `11`
val mut untyped_unfixed = 22; % type `int`

val     tpl_untyped         = """hello"""; % type `str`
val mut tpl_untyped_unfixed = """world"""; % type `str`

val     list_untyped         = List.<int>((11, 22));                 % type `mut List.<int>`
val mut dict_untyped_unfixed = Dict.<str>((a= "hello", b= "world")); % type `mut Dict.<str>`
```
Type inference is applied recursively for tuple and record literals.
```cpl
val tup_untyped             = (   42,    (x= "hello"),    Dict.<bool>((x= false, y= true))); % type `(   42,    (x= "hello"),    mut Dict.<bool>)`
val mut rec_untyped_unfixed = (a= 42, b= ("hello",),   c= List.<bool>((   false,    true))); % type `(a= int, b= (str,),      c= mut List.<bool>)`
```



## Variable Reassignment
By default, variables are **read-only** in that they cannot be reassigned.
```
val my_var: str = "Hello, world!";
set my_var = "¡Hola, mundo!";      %> AssignmentError
```
> AssignmentError: Reassignment of a read-only variable: `my_var`.

In some programming disciplines this pattern is generally encouraged, because
variables holding different values at different points in runtime could lead to unpredictability.
However, changing a variable’s value is useful in some cases, such as in loops or for storing state.

Therefore, we can declare writable variables with the keywords `val mut`,
which allows us to assign it a new value later.
The variable is reassigned with the keyword `set`.
```
val mut my_var = "Hello, world!";
my_var;                           %== "Hello, world!"
set my_var = "¡Hola, mundo!";
my_var;                           %== "¡Hola, mundo!"
```
The statement `set my_var = "¡Hola, mundo!";` is called a **variable reassignment statement**.
A writable variable can be reassigned anywhere in the scope in which it’s visible.


### Pointers
Variables are pointers, which reference preexisting values.
When we access a variable, we reference the value that it points to.
```
val my_var: str = "Hello, world!";
my_var;                            % references the string `"Hello, world!"`
```

When a variable is assigned another variable, it points to the evaluated value of that variable.
```
val a: int = 42;
val b: int = a;
a;               %== 42
b;               % also `42`
```
If that first variable is ever reassigned, the second variable will keep its pointer
to the original value, until it itself is reassigned.
```
val mut a: int = 42;
val mut b: int = a;
a;                   %== 42
b;                   % also `42`
set a = 420;
a;                   % now `420`
b;                   % still `42`
```



## Optional Variables
Variables may be declared without an explicit inital value. These varaibles are called “uninitialized” or “optional”.
```cpl
val mut greeting?: str;
```
When declared, the variable must be writable (with the `mut` keyword) and must be annotated with a type.

When accessed, its type is `Maybe[str]`, but it may only be assigned `str` values.
```cpl
val greet_1: str        = greeting; %> TypeError: Expression of type `Maybe[str]` is not assignable to type `str`.
val greet_2: Maybe[str] = greeting; % ok

set greeting = None[str]();    %> TypeError: Expression of type `None[str]` is not assignable to type `str`.
set greeting = "hello"; % ok
```
There’s a subtle difference between the following two statements:
```cpl
val mut greeting1: Maybe[str] = Some[str]("hello");
val mut greeting2?: str;
```
When read, both variables behave the same, but when reassigned, `greeting1` must be given a `Maybe[str]` value
(either a `Some[str]` or `None[str]`), while `greeting2` may only be assigned `str` values.
Likewise, [the `delete` statement](#delete-statements) cannot be used on `greeting1`.
Optional variables are similar to optional entries of [tuples/records](./types.md#compound-types),
and they pair nicely with the [`isset` operator](./expressions-operators.md#is-set).


### `delete` Statements
To “unset” an optional variable, use the syntax `delete variable;`.
An optional variable cannot be explicitly set to `None[T]` (unless that’s in its declared type),
so the `delete` statement resets it.
```cpl
val mut greeting?: str;

set greeting = "hello";
greeting == Some[str]("hello"); %== true

set greeting = None[str](); %> TypeError: Expression of type `None[str]` is not assignable to type `str`.
delete greeting;            % ok
greeting == None[str]();    %== true
```

The `delete` statement can only be used on optional variables or optional entries on mutable objects.



## Type Claim Declarations
A type claim declaration is a [type claim](./expressions-operators.md#type-claim) for a variable at the block level.
After a variable `expr` has been declared, we may want to **claim** that it has type `T` throughout the rest of the block,
so we would declare the following:
```
claim expr: T;
```
This is convenient because we don’t have to claim the expression everywhere it’s used in later the block.

The code below has to claim that `item.1` is of type `int` every time it’s referenced.
```
val item: [str, int | str] = ["apples", 42];
"""
	Clerk: How many {{ item.0 }} would you like?
	Customer: {{ item.1 as <int> }} please.
	Clerk: Wow, {{ item.1 as <int> }} is a lot!
""";
```
One way to simplify this would be to declare a new variable:
```
val item: [str, int | str] = ["apples", 42];
val quantity: int = item.1 as <int>;
"""
	Clerk: How many {{ item.0 }} would you like?
	Customer: {{ quantity }} please.
	Clerk: Wow, {{ quantity }} is a lot!
""";
```
But a new variable could take up space on the runtime machine.
The only purpose of `quantity` is to make a type claim, so it’s not necessary at runtime.
Instead, we should claim the expression’s type in a claim statement.
Type claims take place only in the compiler, so no memory is wasted.
```
val item: [str, int | str] = ["apples", 42];
claim item.1: int;
"""
	Clerk: How many {{ item.0 }} would you like?
	Customer: {{ item.1 }} please.
	Clerk: Wow, {{ item.1 }} is a lot!
""";
```

Type claim declarations only apply to statements below, not to previous statements.
```
val mut x: bool | int = false;
set x = true;
claim x: int;
```
Even though we claimed `x` as type `int` on line 3, the reassignment to a boolean on line 2 is still valid.

Any reassignments after a claim are still held to that claim, though.
```
val mut x: bool | int = false;
claim x: int;
set x = true; %> TypeError
```
Since we claimed `x` as type `int`, we cannot reassign it to a boolean after the claim is made.



## Unicode Identifiers
Identifiers exist to name variables, among other programming constructs.
**Basic identifiers** take the form of a single upper- or lower-case letter or underscore,
followed by any number of upper- or lower-case letters, digits, and underscores.

This constraint is quite limited and could be a pain point for non-English speakers.
Many other languages have characters in their alphabet that are not allowed by this rule.
Therefore, Counterpoint offers a flexible mechanism for allowing identifiers with
almost any character in the Unicode character set: **Unicode identifiers**.

By wrapping the identifier name with 'apostrophes' (**U+0027**)
(also known as “single-quotes”),
we can include non-ASCII letters.
```
val 'español': str = "Spanish for “Spanish”";
```
In the identifier above, notice the letter `ñ`.
We can access the variable just like any other, as long as we include the name in the delimiters.
```
'español'; %== "Spanish for “Spanish”"
```

These identifiers must always be referred to as such,
even if they don’t contain “special characters”. The converse is true as well.
```
val 'foo': int = 42;
foo * 2;             %> ReferenceError
val bar: int = 420;
'bar' * 2;           %> ReferenceError
```
> ReferenceError: `foo` is never declared.
>
> ReferenceError: `'bar'` is never declared.

This means that the identifiers `foo` and `'foo'` can refer to different values.
```
val foo:   int = 42;
val 'foo': int = 420;
```

We can use Unicode identifiers to name variables with words that appear in the set of reserved keywords.
```
val let: int = 42; %> ParseError
```
> ParseError: Unexpeted token `let`.

The reserved keyword `let` cannot be used as an identifier name,
but we can turn it into a Unicode identifier to work around this limitation.
```
val 'let': int = 42;
```

With Unicode identifiers, we can insert almost any character, including spaces and punctuation symbols.
```
val 'Svaret på den ultimata frågan.': int = 42;
'Svaret på den ultimata frågan.' / 2;           %== 21
```

Unicode identifiers may also contain no characters: The token `''` is a valid identifier.
```
val '': str = "What’s my name?";
```

Note that Unicode identifiers *are not strings*; they’re simply names of declared variables.
Even though Unicode identifiers are not strings, they’re tokenized the same way
that [template literals](./types.md#string-templates) are, with a few differences.

Like template literals,

- Unicode identifiers are not “cooked”, so there are no escape sequences.
	That is, an identifier named `'1\u{24}2'` remains exactly as typed;
	it does not become `'1$2'` and cannot be accessed as such.
	`'1\u{24}2'` and `'1$2'` are two different identifiers.
- Line breaks, whitespace, and non-printing characters are allowed in Unicode identifiers,
	however, keep in mind that this might result in very unreadable code.
- The character **U+0003 END OF TEXT** is not allowed in Unicode identifiers
	(or any token for that matter) and will cause a lexical error.

But unlike template literals,

- Unicode identifiers may contain the character sequences `"""` and `{{` in them,
	since they are not delimited by those characters.
- Unicode identifiers must not contain the character `'` **U+0027 APOSTROPHE**,
	as that would end the token. There is no way to escape this character.
	See the Unicode specification for similar alternative characters.



## Type Declaration
Types can be declared as variables that refer to types at compile-time.
They’re like regular variables, but instead of holding runtime values, they hold types.
The variable that a type is stored in is called a **type alias**.
```
type MyType = int | float;
```
By convention, type aliases are named in *PascalCase*.

Type aliases are initialized when they’re declared, and they’re always read-only — they can never be reassigned.
```
type MyType = int | float;
set MyType = int;          % raises a ParseError or ReferenceError (depending on type expression)
```

Type aliases can be declared only once within a given scope.
Attempting to declare a new type alias with the same name will result in a semantic error.
This behavior is identical to that of regular variables.
```
type MyType = str;
type MyType = int; %> AssignmentError
```
> AssignmentError: Duplicate declaration: `MyType` is already declared.


Also like variables, type aliases can create temporal dead zones.
Counterpoint does not hoist type aliases.
*(NOTE: This may change in future versions.)*
```
val my_first_var: MyFirstType = "Hello, world!";      %> ReferenceError [1]
val my_next_var:  MyNextType  = "Hello, programmer!"; %> ReferenceError [2]
%%------------------------
--- TEMPORAL DEAD ZONE ---
------------------------%%
type MyNextType = str;
```
> 1. ReferenceError: `MyFirstType` is never declared.
> 2. ReferenceError: `MyNextType` is used before it is declared.

We get an error if an identifier is declared as a type but accessed as a regular variable (a “value variable”).
The same is true conversely.
*(NOTE: This may change in future versions.)*
```
type MyFirstType = float;
val my_first_var: anything = MyFirstType; %> ReferenceError [1]

val my_next_var: float = 4.2;
type MyNextType = my_next_var | int;  %> ReferenceError [2]
```
> 1. ReferenceError: `MyFirstType` refers to a type, but is used as a value.
> 2. ReferenceError: `my_next_var` refers to a value, but is used as a type.



## The Blank Identifier
The token `_` (a single underscore) is called the “blank identifier”, and it behaves differently from normal variables.
It may *only* be assigned, and *never* be referenced. It’s actually a syntax error to treat it as an expression.
```cpl
val _: int = 42;    % ok
val x: int = _ + 1; %> ParseError
```

The purpose of a non-referenceable variable is to satisfy the type-checker when assigning
function types and destructured variables.
When assigning a function to a function type, a certain number of parameters are expected,
but we might not always use every parameter in our function body.
The same goes for destructuring — we might not need all the entries in the object being destructured.
Instead of declaring a regular variable that ends up never being referenced,
we can use the blank identifier `_` as a placeholder.
We can even declare it more than once!
```cpl
val _: int = 42;
val _: str = "the answer"; % no duplicate declaration error!

val (_, b, c): (str, str, str) = ("a", "b", "c");
val (_, _, f): (str, str, str) = ("d", "e", "f"); % no duplicate declaration error!

type Binop = \(float, float) => float;
val square: Binop = \(_: float, x: float): float => x * x;
func trinop(_: float, _: float, y: float): float => y + y + y; % no duplicate declaration error!
```

It’s also possible to assign the blank identifier as a type alias.
```cpl
type _ = int | float;
type _ = (str, bool); % no duplicate declaration error!
```
