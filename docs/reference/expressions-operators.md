# Expressions and Operators
This chapter describes operator syntax, semantics, and precedence in expressions and types.



## Value Operators


### Summary Table
In the table below, the horizontal ellipsis character `…` represents an allowed syntax.

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
			<th rowspan="3">1</th>
			<td rowspan="3">Grouping</td>
			<td rowspan="3">unary wrap</td>
			<td rowspan="3">inner-to-outer</td>
			<td><code>( … )</code></td>
		</tr>
		<tr>
			<td><code>[ … ]</code></td>
		</tr>
		<tr>
			<td><code>{ … }</code></td>
		</tr>
		<tr>
			<th rowspan="6">2</th>
			<td>Property Access</td>
			<td rowspan="6">unary postfix</td>
			<td rowspan="6">left-to-right</td>
			<td><code>… . …</code></td>
		</tr>
		<tr>
			<td>Computed Property Access</td>
			<td><code>… .[ … ]</code></td>
		</tr>
		<tr>
			<td>Maybe Access</td>
			<td><code>… ?. …</code></td>
		</tr>
		<tr>
			<td>Computed Maybe Access</td>
			<td><code>… ?.[ … ]</code></td>
		</tr>
		<tr>
			<td>Result Access</td>
			<td><code>… !. …</code></td>
		</tr>
		<tr>
			<td>Computed Result Access</td>
			<td><code>… !.[ … ]</code></td>
		</tr>
		<tr>
			<th>3</th>
			<td>Function Calls</td>
			<td>unary postfix</td>
			<td>left-to-right</td>
			<td><code>… .( … )</code></td>
		</tr>
		<tr>
			<th rowspan="4">4</th>
			<td>Logical Negation</td>
			<td rowspan="4">unary prefix</td>
			<td rowspan="4">right-to-left</td>
			<td><code>! …</code></td>
		</tr>
		<tr>
			<td>Emptiness</td>
			<td><code>? …</code></td>
		</tr>
		<tr>
			<td>Mathematical Affirmation</td>
			<td><code>+ …</code></td>
		</tr>
		<tr>
			<td>Mathematical Negation</td>
			<td><code>- …</code></td>
		</tr>
		<tr>
			<th>5</th>
			<td>Is-Set</td>
			<td>unary prefix</td>
			<td>right-to-left</td>
			<td><code>isset …</code></td>
		</tr>
		<tr>
			<th rowspan="4">6</th>
			<td rowspan="3">Type Cast</td>
			<td rowspan="4">binary infix</td>
			<td rowspan="4">left-to-right</td>
			<td><code>… as …</code></td>
		</tr>
		<tr>
			<td><code>… as? …</code></td>
		</tr>
		<tr>
			<td><code>… as! …</code></td>
		</tr>
		<tr>
			<td>Type Claim</td>
			<td><code>… as &lt; … &gt;</code></td>
		</tr>
		<tr>
			<th>7</th>
			<td>Exponentiation</td>
			<td>binary infix</td>
			<td>right-to-left</td>
			<td><code>… ^ …</code></td>
		</tr>
		<tr>
			<th rowspan="2">8</th>
			<td>Multiplication</td>
			<td rowspan="2">binary infix</td>
			<td rowspan="2">left-to-right</td>
			<td><code>… * …</code></td>
		</tr>
		<tr>
			<td>Division</td>
			<td><code>… / …</code></td>
		</tr>
		<tr>
			<th rowspan="2">9</th>
			<td>Addition</td>
			<td rowspan="2">binary infix</td>
			<td rowspan="2">left-to-right</td>
			<td><code>… + …</code></td>
		</tr>
		<tr>
			<td>Subtraction</td>
			<td><code>… - …</code></td>
		</tr>
		<tr>
			<th rowspan="8">10</th>
			<td>Less Than</td>
			<td rowspan="8">binary infix</td>
			<td rowspan="8">left-to-right</td>
			<td><code>… < …</code></td>
		</tr>
		<tr>
			<td>Greater Than</td>
			<td><code>… > …</code></td>
		</tr>
		<tr>
			<td>Less Than or Equal To</td>
			<td><code>… <= …</code></td>
		</tr>
		<tr>
			<td>Greater Than or Equal To</td>
			<td><code>… >= …</code></td>
		</tr>
		<tr>
			<td>Not Less Than</td>
			<td><code>… !< …</code></td>
		</tr>
		<tr>
			<td>Not Greater Than</td>
			<td><code>… !> …</code></td>
		</tr>
		<tr>
			<td>TBA</td>
			<td><code>… is …</code></td>
		</tr>
		<tr>
			<td>TBA</td>
			<td><code>… !is …</code></td>
		</tr>
		<tr>
			<th rowspan="4">11</th>
			<td>Identity</td>
			<td rowspan="4">binary infix</td>
			<td rowspan="4">left-to-right</td>
			<td><code>… === …</code></td>
		</tr>
		<tr>
			<td>Non-Identity</td>
			<td><code>… !== …</code></td>
		</tr>
		<tr>
			<td>Equality</td>
			<td><code>… == …</code></td>
		</tr>
		<tr>
			<td>Non-Equality</td>
			<td><code>… != …</code></td>
		</tr>
		<tr>
			<th rowspan="2">12</th>
			<td>Conjunction</td>
			<td rowspan="2">binary infix</td>
			<td rowspan="2">left-to-right</td>
			<td><code>… && …</code></td>
		</tr>
		<tr>
			<td>Alternative Denial</td>
			<td><code>… !& …</code></td>
		</tr>
		<tr>
			<th rowspan="2">13</th>
			<td>Disjunction</td>
			<td rowspan="2">binary infix</td>
			<td rowspan="2">left-to-right</td>
			<td><code>… || …</code></td>
		</tr>
		<tr>
			<td>Joint Denial</td>
			<td><code>… !| …</code></td>
		</tr>
		<tr>
			<th>14</th>
			<td>Conditional</td>
			<td>ternary infix</td>
			<td>n/a</td>
			<td><code>if … then … else …</code></td>
		</tr>
	</tbody>
</table>

The **Grouping** column indicates the direction of application of *grouping symbols*,
where none are present.
For example, exponentiation is grouped right-to-left, so the ambiguous expression
`a ^ b ^ c` is interpreted as `a ^ (b ^ c)`, and not as `(a ^ b) ^ c`.
Operations that have the same precedence, like multiplication and division,
are grouped together:
`a / b * c` is interpreted left-to-right as `(a / b) * c`.

Sometimes you might see the above notion expressed as the term “associativity”,
but in this documentation we use “grouping” instead to differentiate it from
the mathematical definition of “associativity”, which has a related meaning.
Some binary operations are truly **associative**, which means that any grouping interpretation,
whether left-to-right or right-to-left, would yield the same mathematical result.
Addition is an example of this. Whether we group *left-to-right* `(a + b) + c`
or *right-to-left* `a + (b + c)`, the output remains the same.
Operations that are associative are indicated as so in their respective sections below.


### Grouping
Read about Tuples, Records, Lists, Dicts, Sets, and Maps in the [Types](./types.md) chapter.

#### Block-Expressions
```
`{` Statement+ `}`
```
Block-expressions are blocks of statements that produce expressions.
A block-expression *is* an expression — its value has a type and can be passed around and operated on like any other expression.
```cpl
val blex: int = {
	print.("evaluates to 42");
	42;
};
blex == 42; %== true
```
Like all [blocks](./statements.md#blocks-and-scoping), a block-expression must contain at least one statement.
Furthermore, if the last statement in a block-expression is an [expression-statement](./statements.md#expression-statements),
then it has a special name: the **determinant** — as it determines the block-expression’s value.
In the example above, the determinant is `42;`.

If the last statement of a block-expression is not an expression-statement, then the expression has no value, and it has a void type.
```cpl
val blex: int = {
	print.("evaluates, but does not have a value");
	val value: int = 42;
}; %> TypeError
```
An expression with a void type is like a void function call. These types of expressions cannot be passed around or operated on.
(“Void” is not a real type in the type system; it’s just a marker given to expressions that execute but do not have a value.)

We run into a similar situation when block-expression *has* a determinant, but that determinant itself is void.
```cpl
val blex: int = {
	print.("evaluates, but does not have a value");
	val value: int = 42;
	print.(value); % <-- determinant
}; %> TypeError
```
Because the `print` is a void function, the block-expression has a void type, thus can’t be assigned to the variable.
(The only exception is when a void block-expression is returned from a void function.
See the [Functions](./functions.md) chapter for details.)

A block-expression might never finish execution!
```cpl
val mut count: int = 0;
val blex: int = {
	while count >= 0 do {
		set count += 1;
	};
	42; % <-- determinant
}; % no type error
```
In this example, static control flow analysis can reach the determinant and determine the block’s type, so the assignment is valid.
At runtime however, the [`while` loop](./statements.md#loops) runs indefinitely, so the variable never actually gets assigned.
While this program compiles successfully, it’ll crash when run.

Block-expressions may contain `break`, `skip`, `return`, and `throw` statements (depending on lexical context).
These are called **abrupt completions**, because they abruptly transfer control out of the block
without finishing the evaluation of it.
Specifically, `break` or `skip` statements will apply to the containing loop,
and `return`/`throw` statements will apply to the containing function.
```cpl
func f(mut i: int): str {
	while true do {
		set i += 1;
		val is_threeven: bool = mod.(i, 3) == 0 && {
			skip; % restarts the `while` loop, not this block-expression
		}; % no type error
		val is_divisble_by_7: bool = mod.(i, 7) == 0 && {
			return "exit"; % returns from the function, not this block-expression
		}; % no type error
	};
	return "done";
}
```
Because these statements are abrupt, the end of the block-expression is unreachable via control flow analysis;
therefore the block-expression is of type `nothing`, the bottom type (a subtype of every type).
That’s why these block-expressions are assignable to `bool` variables, and we don’t get type errors as we did in the examples above.
The difference is that the compiler can determine that a *void* block-expression will finish evaluation but will not produce a value;
whereas it knows that block-expressions with abrupt statements will never even finish evaluation.

This table highlights some exceptional cases.

| Case                                                    | Block Type | Runtime Behavior            | Is Assignable             |
| ------------------------------------------------------- | ---------- | --------------------------- | ------------------------- |
| last statement is an expression-statement with type `T` | `T`        | completes execution         | yes, to type `T` or wider |
| last statement is a void expression-statement           | void       | completes execution         | no                        |
| last statement is not an expression-statement           | void       | completes execution         | no                        |
| contains an expression of type `nothing`                | `nothing`  | fails to complete execution | yes, to any type          |
| contains an abrupt statement                            | `nothing`  | fails to complete execution | yes, to any type          |
| contains an infinite loop or infinite recursive call    | `T`        | fails to complete execution | yes, to type `T` or wider |


### Property Access
```
<Tuple>  `.` int-literal
<Record> `.` word
<Object> `.` `[` <Object> `]`

<Tuple>  `?.` int-literal
<Record> `?.` word
<Object> `?.` `[` <Object> `]`

<Tuple>  `!.` int-literal
<Record> `!.` word
<Object> `!.` `[` <Object> `]`
```
The **property accesss** syntax is a unary operator on an object.
The object it operates on is called the **binding object** and
the property it accesses is called the **bound property** (or index, field, member, etc.).
There are two flavors of the operator: literal access and computed access.

Literal access requires a literal (integer or word) and can be used to access a literal bound property.
Tuples take integer literal properties and records take word (key) properties.
For example: `tuple.3` and `record.prop`.

Computed access must be used when the bound property name is computed,
such as an operation of expressions, e.g., `map.[expr]`.
The expression in the brackets evaluates to an index, key, element, or antecedent
of the binding object and must be of the correct type.

More information about property access when used on collections
can be found in the [Types](./types.md) chapter.

#### Maybe Access
The **maybe access** syntax is almost the same as property access, except that
the operator always produces a `Maybe` object — a `None` object if and when there is no such bound property
on the binding object at runtime, else a `Some` object containing the accesssed value.
This operator is designed to work with optional entries on types, such as optional properties on a record type, as well as
[the `Maybe` algeraic sum type](./types.md#maybes).

Given a record `record` of type `(a: bool, b?: int)`,
the expression `record.b` would result in a crash if there’s no actual value at that location,
so the compiler raises an error when using that syntax.
Using the maybe access operator though, `record?.b` will produce a `Some` containing the value at `record.b`
if it exists, but otherwise will produce a `None` and avoid the crash.
An equivalent syntax exists for dynamic access: `map?.[expr]`, etc.

Conversely, maybe access syntax is not allowed for required properties: `record?.a` would raise a compiler error.

If the *binding object is a `Maybe`*, then the maybe access operator produces another `Maybe`.
For example, `None[T]().property` is a type error, but `None[T]()?.property` will simply produce a new `None[U]`
(and not the same `None[T]` reference object).
This facet makes maybe access safe to use when chained.

When the maybe access operator is chained, it should be chained down the line,
e.g., `x?.y?.z` is equivalent to `(x?.y)?.z`.
However, `x?.y.z` (which can be thought of as `(x?.y).z`) is not the same,
and will result in a type-error if `z` is not a property of `Maybe`.

**Type-Checking Note:**

For static types (e.g., tuples and records),
either the normal or maybe access operator is allowed, corresponding to the optionality of the entry being accessed.
When the maybe access operator is used for an optional entry, the entry type is wrapped in a `Maybe`.
```cpl
claim record: (required: bool, optional?: int);
record.required;  %: bool
record?.required; %> TypeErrorInvalidOperation
record.optional;  %> TypeErrorInvalidOperation
record?.optional; %: int?
```
For dynamic types (e.g., lists and dicts),
both normal and maybe access operators are allowed.
The normal access operator treats all entries as required (does not wrap the declared type in `Maybe`), and
the maybe access operator treats all entries as optional (wraps the property type in `Maybe`).
```cpl
claim dict: [:float];
dict.[@prop];  %: float
dict?.[@prop]; %: Maybe[float]
```

#### Result Access
// TODO: v0.5.0


### Logical Negation, Emptiness
```
`!` <anything>
`?` <anything>
```
The **logical negation** operator, `!`, returns the opposite boolean value of the operand’s “logical value”.

A value’s “logical value” is the boolean value that most closely corresponds to that value.
A value is said to be “falsy” if its “logical value” is `false`. Otherwise the value is said to be “truthy”.

The operator `!` logically negates the “logical value” of the operand.
If the value is “falsy”, `true` is produced; otherwise `false` is produced.

The **emptiness operator**, `?`, determines whether a value is considered “empty”.
A value is “empty” if it’s “falsy”, if it’s a zero numeric value (`0`, `0.0`, or `-0.0`),
or if it’s an empty string or empty collection (such as an array or set).

| “Falsy” Values | “Empty” Values   | “Truthy” Values |
| -------------- | ---------------- | --------------- |
| `null`         | `null`           |                 |
| `false`        | `false`          | `true`          |
|                |                  | all symbols     |
|                | `0`              | all integers    |
|                | `+0`             | all naturals    |
|                | `0.0`, `-0.0`    | all floats      |
|                | `""`             | all strings     |
|                | `()`, `[]`, `{}` | all collections |
| all `None`s    | all `None`s      | all `Some`s     |
|                |                  | any other value |


### Mathematical Affirmation, Mathematical Negation
```
`+` <Number>
`-` <Number>
```
The **mathematical affirmation** operator, `+`, and
the **mathematical negation** operator, `-`,
are valid only on number types.
The affirmation is a no-op (the number itself is produced),
and the negation computes the additive inverse, or “negation”, of the number.
Any integer base can be used.

These operators can be chained, and when done so, are grouped right-to-left.
For example, `-+-8` is equivalent to `-(+(-8))`.

```
val int_p = 512;
val int_n = -\x200;

+int_p; %== 512
+int_n; %== -512

-int_p; %== -512
-int_n; %== 512
```

Recognize that number tokens can begin with **U+002B PLUS SIGN** or **U+002D HYPHEN-MINUS**,
even if they’re prefixed with a radix.
For example, `-\x200` is lexed as a single token, and not two tokens `-` and `\x200`,
even though its value is equivalent to the result of the operation `-(\x200)`.
The same is true for `+\x200`, but instead this is lexed as a natural number literal,
which is a completely different type than the result of applying `+` to `\x200`.
For that, we’d need to insert either parentheses or whitespace (`+(\x200)` or `+ \x200`).
This is important to mention because it could also affect how we write
[additive expressions](#parsing-additive-expressions).


### Is-Set
**WARNING:** *This section is obsolete.*

```
`isset`  <Assignee>
`!isset` <Assignee>
```
The `isset` operator returns a boolean indicating whether a variable or property has been assigned, regardless of its value.
For non-optional variables and properties, it always returns `true`.
For [optional variables](./variables.md#optional-variables)/properties that have been set or reassigned to a value, the operator returns `true`.
If the variable/property has never been assigned, or has been assigned and then deleted, the operator returns `false`.
This operator is dynamic and may return different results at various points in a program.

`!isset` is a single operator that returns the negation of `isset`.

```cpl
val mut greeting?: str;
print.(greeting);        %> null
print.(isset greeting);  %> false
print.(!isset greeting); %> true

set greeting = "hello";
print.(greeting);        %> "hello"
print.(isset greeting);  %> true
print.(!isset greeting); %> false

delete greeting;
print.(greeting);        %> null
print.(isset greeting);  %> false
print.(!isset greeting); %> true
```

Even if a variable has the `null` value, the `isset` operator returns `true`.
Thus comparing an optional variable to `null` is not sufficient.
```cpl
val mut amount?: float | null;
print.(amount == null); %> true
print.(isset amount);   %> false

set amount = null;
print.(amount == null); %> true
print.(isset amount);   %> true
```

Syntactically, `isset` may only be applied to variables and property accessors
(that is, anything that can be assigned in a [`set` statement](./variables.md#variable-reassignment)).
It is not applicable to arbitrary expressions.
```cpl
% well-formed syntax:
isset variable;
isset object.property;
isset tuple.0;
isset chained.1.calls.("and").prop.2.().xsors; % ending with an accessor

% syntax errors:
isset (x);
isset (a || b);
isset -c;
isset f.();
isset if a then b else c;
isset { x; };
```
Like other unary operators, `isset` binds tighter than binary operators.
The following pairs are well-formed and equivalent:
```cpl
isset a || b;
(isset a) || b;

isset a && isset b;
(isset a) && (isset b);
```
`isset` binds looser than the symbolic unary operators.
```cpl
+isset c;   %> SyntaxError
+(isset c); % well-formed
```
`!isset` is a single parse token. `!isset c` is syntax sugar for `!(isset c)`.


### Type Cast/Claim
```
<Object>   as  <Class>
<Object>   as? <Class>
<Object>   as! <Class>
<anything> as  `<` <Type> `>`
```
The expression `expr as Klass` explicitly **casts** the `expr` into a `Klass`.
This means that at compile time, `expr` is treated as type `Klass` within its containing expression,
and the object to which `expr` evaluates is converted to a `Klass` instance at runtime.
If the runtime conversion is not possible, than an error is thrown.

`expr as? Klass` always returns a `Maybe` object and never throws.
If `expr` is a `Klass` instance, a `Some` is returned; otherwise it returns a `None`.

`expr as! Klass` always returns a `Result` object and never throws.
If `expr` is a `Klass` instance, an `Ok` is returned; otherwise it returns a `Fail`.

The expression `expr as <T>` tells the type system to treat `expr` as type `T`,
even though it might have been computed as a different type.
This is called a **type claim**, because we’re *claiming* that `expr` is of type `T`.
(We say “claim” instead of “assert”, because no runtime error is thrown.)

Normally, the compiler will compute the type of an expression, but sometimes the compiler gets it wrong,
or we as programmers know more than the compiler does, based on conditions or circumstances of our code.
We can use a claim to tell the compiler, “I know what I’m doing and the type should be *that*.”

Type claims are a general form of [non-null assertions] (link pending).
For example, we could use non-null assertion to say that an optional entry exists on an object:
```
val mut item: (str, ?: int) = ("apples", 42);
val quantity: int = item?.1~?;
```
Since `item.1` is optional, `item?.1` is of type `int | null`.
By using the non-null assertion `~?`, we can subtract type null.

The more general form of this is simply claiming that `item?.1` is of type `int`:
```
val mut item: (str, ?: int) = ("apples", 42);
val quantity: int = item?.1 as <int>;
```

Type claims can be used in situations where non-null assertion cannot.
Whereas non-null assertions can only tell the compiler that a property *exists*,
type claims can widen, narrow, or shift the type of an expression.
```
val mut item: (str, int | str) = ("apples", 42);
val ingredient: anything   = item.0 as <anything>;   % widening
val quantity:   int        = item.1 as <int>;        % narrowing
val in_stock:   int | bool = item.1 as <int | bool>; % shifting
```

Unless either type is `nothing` (the Bottom Type), a compiler error is thrown
when the operand’s computed type is disjoint with the claimed type.
```cpl
42 as <str>; %> TypeError
```
To work around this, go up and back down again:
```cpl
42 as <anything> as <str>;
```
In the future, the syntax `expr as! <T>` may be available.

#### Cast vs Claim
A runtime cast (`expr as Klass`) will always check whether `Klass` is a class, and whether `expr` is actually an instance of it at runtime;
if not, then the program throws. This operator is preferred in such circumstances.
```
val animal: Animal = Cat.();
val cat: Cat = animal as Cat; % cast is allowed (`Cat` can be converted to `Cat`)
cat.meow.();                  % calls `meow` on the `Cat` instance

val dog: Dog = animal as Dog; % throws error: `Cat` cannot be converted to `Dog`
dog.woof.();                  % unreachable
```
The `as?` and `as!` casts can be useful in tandem with maybe/result access respectively.
```
val cat_m: Maybe.<Cat> = animal as? Cat; %== Some.<Cat>
cat_m?.meow.();                          % calls `meow`

val dog_m: Maybe.<Dog> = animal as? Dog; %== None
dog_m?.woof.();                          %== None

val cat_r: Result.<Cat> = animal as! Cat; %== Ok.<Cat>
cat_r!.meow.();                           % calls `meow`

val dog_r: Result.<Dog> = animal as! Dog; %== Fail
dog_r?.woof.();                           %== Fail
```

A compile-time claim (`expr as <Klass>`) *claims* to the type-checker that `expr` is already of type `Klass`,
but no double-check is performed at runtime. The program will proceed as usual, assuming `expr` is assignable to type `Klass`.
That means that if it’s *not* such an instance, an error could be thrown down the line,
for example, when attempting to access a nonexistent method.
```
val animal: Animal = Cat.();
val cat: Cat = animal as <Cat>; % claim is allowed (`Animal` and `Cat` overlap)
cat.meow.();                    % calls `meow` on the `Cat` instance

val dog: Dog = animal as <Dog>; % claim is allowed (`Animal` and `Dog` overlap)
dog.woof.();                    % throws error: method `woof` not found on `Cat` instance
```

The benefits that type claim over type cast include the following, as demonstrated in the last section.
- We can narrow types that would otherwise be too wide.
- We can use type operator syntax like intersections and unions.
- We can reference non-class types and type aliases by name.

A note of caution: **Type claims should never be used to “hack” the compiler**.
Using type claims to “just get your code to compile” is never recommended,
because it won’t prevent runtime errors and it will most likely cause more problems down the road.
But there are cases in which human reasoning about type safety outsmarts the compiler,
so in those cases we may use type claims to write good code.


### Exponentiation
```
<Number> `^` <Number>
```
The **exponentiation** operator is valid only on number types.
It produces the result of raising the left-hand operand to the power of the right-hand operand.
Whole-number radices can be mixed, but numeric types cannot.

```
3 ^ 2;    %== 9
2 ^ \b11; %== 8
```

Expressions involving exponentiation can be imprecise.
For example, the mathematical value of *3<sup>-2</sup>* is one-ninth, approximately 0.111111,
which is not an integer. Since integers are truncated, `3 ^ -2` will produce `0`.

Exponentiation is *grouped right-to-left*.
This means that where grouping is ambiguous, the expression is evaluated from right to left.
For example, `a ^ b ^ c` is equivalent to `a ^ (b ^ c)` and not `(a ^ b) ^ c`.
This is consistent with mathematical notation,
where *a<sup>b<sup>c</sup></sup>* is interpreted as *a<sup>(b<sup>c</sup>)</sup>*.

#### Exponentiation: Order of Operations
In mathematics, exponents are applied before negation (which is multiplication).
However, in Counterpoint, [mathematical negation](#mathematical-affirmation-mathematical-negation)
is a unary operator, which is stronger than any binary operator.
**Mathematical negation is not considered multiplication**,
even if it indeed produces the same mathematical result of multiplying by -1.
Therefore, we can end up with confusing syntax such as this:
```
-3 ^ 2
```
While *mathematically*, *&minus;3<sup>2</sup>* is equivalent to *&minus;1&middot;3<sup>2</sup>*,
producing *&minus;9*, the Counterpoint expression `-3 ^ 2`, is *not equivalent*.
Mathematical negation is stronger than exponentiation, so Counterpoint will compute `-3`
first as a unary operation (or, in this case, as a single token),
and then raise that value to the power of `2`, producing `9`.
Writing such an ambiguous syntax could cause developers to scratch their heads
wondering why `-3 ^ 2` is `9`.

As a recommendation,
though expressions like `-3 ^ 2` are well-formed and will produce a numerical result,
it’s best practice to place parentheses where they’ll reduce ambiguity and improve readability.
So if raising `-3` to the power of `2` is intended, the expression is best written
```
(-3) ^ 2
```
On the other hand, if the intention is actually to raise `3` to the power of `2` first,
and then negate, the expression should be written `-(3 ^ 2)` or `-1 * 3 ^ 2`.


### Multiplicative
```
<Number> `*` <Number>
<Number> `/` <Number>
```
The **multiplication** operator, `*`, and
the **division** operator, `/`,
are valid only on number types.
They produce the respective mathematical product and quotient of the operands.
Whole-number radices can be mixed, but numeric types cannot.

Multiplication is **associative**, which means the following expressions produce the same result,
for any numbers `‹a›`, `‹b›`, and `‹c›`:
```
‹a› * ‹b› * ‹c›
(‹a› * ‹b›) * ‹c›
‹a› * (‹b› * ‹c›)
```

Multiplication and division perform the standard arithmetic operations,
keeping in mind that the result of division `/` on integers or naturals is truncated,
and division by `0` will result in an error.
```cpl
+\o12 / +\q11; % produces `+2`
3 / 2;         % produces `1`, since 1.5 gets truncated
4 / 0;         % runtime error
```


### Additive
```
<Number> `+` <Number>
<Number> `-` <Number>
```
The **addition** operator, `+`, and
the **subtraction** operator, `-`,
are valid only on number types.
They produce the respective mathematical sum and difference of the operands.
Whole-number radices can be mixed, but numeric types cannot.

Addition is **associative**, which means the following expressions produce the same result,
for any numbers `‹a›`, `‹b›`, and `‹c›`:
```
‹a› + ‹b› + ‹c›
(‹a› + ‹b›) + ‹c›
‹a› + (‹b› + ‹c›)
```

Addition and subtraction perform the standard arithmetic operations,
keeping in mind that integer overflow is possible
when going beyond the maximum/minimum integer values.
Subtraction of naturals bounds to zero.
```cpl
+\o12 - +\q11; % produces `+5`
+5 - +10;      % produces `+0`, since -5 gets bound from below
```

#### Parsing Additive Expressions
[Previously in this chapter](#mathematical-affirmation-mathematical-negation)
we saw that number tokens can begin with **U+002B PLUS SIGN** or **U+002D HYPHEN-MINUS**.
Since those characters are the same as the additive operator symbols,
this could affect how additive expressions are parsed.

```
3+1
```
In the code above, our intention was to write the sum of `3` and `1`.
The lexer will however produce two number tokens: `3` and `+1`,
since it thinks `+1` is a single token.
This will lead the parser to fail, since a number token cannot follow another number token
in the formal grammar.

To fix the error, we can use whitespace indicate token boundaries.
```
3 + 1
```
Now the lexer produces three tokens: a number `3`, a punctuator `+`, and a number `1`.
The parser receives these tokens and produces the correct expression.
(Note that the code `3+ 1` would be sufficient, but perhaps not as readable.)


### Comparative
```
<Number> `<`  <Number>
<Number> `>`  <Number>
<Number> `<=` <Number>
<Number> `>=` <Number>
<Number> `!<` <Number>
<Number> `!>` <Number>

<Object> `is`  <Class>
<Object> `!is` <Class>
```
The numerical comparative operators,

- **less than** `<`
- **greater than** `>`
- **less than or equal to** `<=`
- **greater than or equal to** `>=`
- **not less than** `!<`
- **not greater than** `!>`

compare number types in the usual sense. The result is a boolean value.
Whole-number radices as well as different numeric types can be mixed.

In numerical uses, `!<` is equivalent to `>=`, and `!>` is equivalent to `<=`.
In general, however, this might not hold for future operator overloads.
For instance, if the relational operators were overloaded to mean “subset” for sets,
then `a !< b` (“`a` is not a strict subset of `b`”) does not necessarily mean
that `a >= b` (“`a` is a superset of ”).

When comparing mixed types in the numeric comparison operations,
values are “promoted” to the type that encompasses the greater number of values.
Specifically, when mixing `int` and `nat`, the `int` is converted to `nat`,
and when mixing `int` and `float` or `nat` and `float`, the non-float value is converted to `float`.
The order of promotion precedence:
```
int --> nat --> float
```
Conversions are made only for determining mathematical inequality; the value of the operand does not change.
Note that conversions may be lossy; see [Numeric Conversions](./built-ins.md#numeric-conversions) for details.

The object comparative operators `is` and `!is` are not currently available,
but they are reserved for future semantics.


### Equality
```
<anything> `===`  <anything>
<anything> `!==`  <anything>
<anything> `==`   <anything>
<anything> `!=`   <anything>
```
These operators compare two values.
Any type of operands are valid. The result is a boolean value.
Integer bases as well as integers and floats can be mixed.

The **identity** operator `===` determines whether two operands are exactly “the same”.
This means different things for value types and reference types.
For primitive types, which are value types, the operator produces `true` when the two operands
are indistinguishable at run-time. Non-primitive value types are compared by their constituent parts.
For reference types, this operator produces `true` when both operands point to the same object in memory.
For some types, identity and equality might not necessarily return the same result:
objects that are considered equal might not be identical.

Per the [IEEE-754-2019] specification, the floating-point values `0.0` and `-0.0` do not have
the same bitwise representation; therefore the expression `0.0 === -0.0` evaluates to `false`.
Floating-point values and integer values are never identical, so the expression `42 === 42.0` is also `false`.

The **equality** operator `==` determines whether two operands are considered “equal” by some definition,
based on the type of the operands.
For `null`, boolean, symbol, and string values, equality is one in the same with identity.
For number values, equality is determined by mathematical quantity, thus `0.0 == -0.0` is `true`.
Mixed number types of the same quantity are equal, so `42 == 42.0` is also `true`.
Mixed-type values are converted to a common type using the “promotion” rules explained above.
Conversions are made only for determining mathematical equality; the value of the operand does not change.
Note that conversions may be lossy; see [Numeric Conversions](#numeric-conversions) for details.

The non-identity operator `!==` is simply the logical negation of `===`, and
the non-equality operator `!=` is simply the logical negation of `==`.

All four of these operators are **commutative**, meaning the order of operands does not change the resulting value.
```
‹a› === ‹b›; % same as `‹b› === ‹a›`
‹a› !== ‹b›; % same as `‹b› !== ‹a›`
‹a› ==  ‹b›; % same as `‹b› ==  ‹a›`
‹a› !=  ‹b›; % same as `‹b› !=  ‹a›`
```
Remember: Expressions are always evaluated from left to right, so side-effects could still be observed.

#### Equality by Composition
The equality operator `==` compares compound objects by their type and entries.
Two compound objects are equal if they have the same constructor and contain equal values.
For tuples and lists, entries are compared index by index; for records and dicts, key by key;
and for maps, antecedent–consequent pairs are compared recursively (as they may be objects themselves).
Sets are equal if they contain each others’ elements.

Counterpoint takes an “innocent until proven guilty” approach:
values that are indistinguishable are considered equal until determined otherwise.
For example, if two reference objects contain properties that point to each other,
the compiler will assume they’re equal until it can find a property that mismatches.
If it can’t, it’ll just return true instead of diving down an infinitely long rabbit hole.

Of course, the identity operator (`===`) *always* compares reference objects by reference,
but compound data values are still compared compositionally, and the same principle applies —
assume identical until determined otherwise.


### Conjunctive
```
<anything> `&&` <anything>
<anything> `!&` <anything>
```
The **logical conjunction** operator `&&` (”and”) produces the left-hand operand if it is “falsy”;
otherwise it produces the right-hand operand. The operands may be of any type.

The `&&` operator short-circuits, in that evaluation of the right-hand operand does not take place
if it does not need to. If the left-hand operand of an `&&` operation is “falsy”,
then that operand is produced and the right-hand operand is not evaluated.
Short-circuiting can speed up runtime computation if the “simpler” expression is on the left.

Logical conjunction is **associative**, which means the following expressions produce the same result,
for any values `‹a›`, `‹b›`, and `‹c›`:
```
‹a› && ‹b› && ‹c›
(‹a› && ‹b›) && ‹c›
‹a› && (‹b› && ‹c›)
```

The **logical alternative denial** operator `!&` (“nand”) is the logical negation of conjunction.
```
a !& b; % sugar for `!(a && b)`
```


### Disjunctive
```
<anything> `||` <anything>
<anything> `!|` <anything>
```
The **logical disjunction** operator `||` (“or”) produces the left-hand operand if it is “truthy”;
otherwise it produces the right-hand operand. The operands may be of any type.

The `||` operator short-circuits, in that evaluation of the right-hand operand does not take place
if it does not need to. If the left-hand operand of an `||` operation is “truthy”,
then that operand is produced and the right-hand operand is not evaluated.
Short-circuiting can speed up runtime computation if the “simpler” expression is on the left.

Logical disjunction is **associative**, which means the following expressions produce the same result,
for any values `‹a›`, `‹b›`, and `‹c›`:
```
‹a› || ‹b› || ‹c›
(‹a› || ‹b›) || ‹c›
‹a› || (‹b› || ‹c›)
```

The **logical joint denial** operator `!|` (“nor”) is the logical negation of disjunction.
```
a !| b; % sugar for `!(a || b)`
```


### Conditional
```
`if` <bool> `then` <anything> `else` <anything>
```
The conditional operator is a ternary operator that takes three operand expressions:
a condition, a consequent, and an alternative.
The condition must be a boolean expression, and the consequent and alternative may be of any type.
The consequent and alternative expressions are sometimes called “branches”:
the “then branch” and the “else branch” respectively.

The result of the conditional expression is either the consequent or the alterantive,
depending on the value of the condition.
If the condition is true, the consequent is produced, otherwise the alternative is produced.

Evaluation of a conditional expression is short-circuited: Only the produced branch is evaluated.
For example, if the condition evalutes to `false`, then only the alternative is evaluated and then produced;
the consequent does not even get evaluated.
This is meaningful when evaluation of an expression produces side-effects, such as a routine call.
Because one of the branches is not evaluated, its side-effects (if any) will not occur.



## Type Operators


### Summary Table
In the table below, the horizontal ellipsis character `…` represents an allowed syntax.
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
			<th rowspan="3">1</th>
			<td rowspan="3">Grouping</td>
			<td rowspan="3">unary wrap</td>
			<td rowspan="3">inner-to-outer</td>
			<td><code>( … )</code></td>
		</tr>
		<tr>
			<td><code>[ … ]</code></td>
		</tr>
		<tr>
			<td><code>{ … }</code></td>
		</tr>
		<tr>
			<th>2</th>
			<td>Type Property Access</td>
			<td>unary postfix</td>
			<td>left-to-right</td>
			<td><code>… . …</code></td>
		</tr>
		<tr>
			<th rowspan="5">3</th>
			<td>Nullish</td>
			<td rowspan="5">unary postfix</td>
			<td rowspan="5">left-to-right</td>
			<td><code>… ?</code></td>
		</tr>
		<tr>
			<td>TBA</td>
			<td><code>… !</code></td>
		</tr>
		<tr>
			<td>List</td>
			<td><code>… []</code></td>
		</tr>
		<tr>
			<td>Tuple</td>
			<td><code>… […]</code></td>
		</tr>
		<tr>
			<td>Set</td>
			<td><code>… {}</code></td>
		</tr>
		<tr>
			<th>4</th>
			<td>Mutable</td>
			<td>unary prefix</td>
			<td>right-to-left</td>
			<td><code>mut …</code></td>
		</tr>
		<tr>
			<th>5</th>
			<td>Intersection</td>
			<td>binary infix</td>
			<td>left-to-right</td>
			<td><code>… & …</code></td>
		</tr>
		<tr>
			<th>6</th>
			<td>Union</td>
			<td>binary infix</td>
			<td>left-to-right</td>
			<td><code>… | …</code></td>
		</tr>
	</tbody>
</table>


### Grouping
Read about Tuples, Records, Lists, Dicts, Sets, and Maps in the [Types](./types.md) chapter.


### Type Property Access
```
<Type> `.`  int-literal
<Type> `.`  word
<Type> `?.` int-literal
<Type> `?.` word
```
The **type property accesss** syntax for types is analogous to the property access syntax of values.
It accesses the index or key of a tuple or record type respectively.
```
type T = (bool, int, str);
type T1 = T.1;             %== int
type T_1 = T.-1;           %== str
type T3 = T.3;             %> TypeError

type R = (a: bool, b?: int, c: str);
type Ra = R.a;                       %== bool
type Rc = R?.b;                      %== int | null
type Rd = R.d;                       %> TypeError
```


### To-Maybe
```
<Type> `?`
```
The **to-maybe** operator creates a new [Maybe type](./types.md#maybes) containing the operand.
```cpl
type T = int?; % equivalent to `type T = Maybe[int];`
```


### TBA
```
<Type> `!`
```
To be announced.


### Mutable
```
`mut` <Type>
```
The `mut` type operator allows properties in a complex type to be reassigned.
It allows us to modify composite objects by adding, removing, and changing entries.
It will also allow us to reassign fields and call mutating methods on class instances.
```
val elements: mut str{} = {"water", "earth", "fire", "wind"};
elements.["wind"] = false;
elements.["air"]  = true;
elements; %== {"water", "earth", "fire", "air"}
```
If `elements` were just of type `str{}` (without `mut`),
then attempting to modify it would result in a [Mutability Error](./errors.md#mutability-errors-24xx).


### Intersection
```
<Type> `&` <Type>
```
The **intersection** operator creates a strict combination of the operands.
```
type T = (foo: bool) & (bar: int);
val v: T = (
	foo= false,
	bar= 42,
);
```

When accessing an *intersection* of record types, we can access the *union* of the properties of each type.
```
type Employee = (
	name:        str,
	id:          int,
	jobTitle:    str,
	hoursWorked: float,
);
type Volunteer = (
	name:        str,
	agency:      str,
	hoursWorked: float,
);
claim alice: Employee & Volunteer;
alice.name;        %: str
alice.id;          %: int
alice.jobTitle;    %: str
alice.hoursWorked; %: float
alice.agency;      %: str
```
Type `Employee & Volunteer` is *both* an employee *and* a volunteer,
so we’re guaranteed it will have the properties that are present in *either* type.

Overlapping properties in an intersection are themselves intersected.
```
type A = (
	key:    1 | 2 | 3,
	valueA: int,
);
type B = (
	key:    2 | 3 | 4,
	valueB: float,
);
claim data: A & B;
data.key;    %: 2 | 3 % gotten by `(1 | 2 | 3) & (2 | 3 | 4)`
data.valueA; %: int
data.valueB; %: float
```

This holds for tuple types as well, accounting for indices rather than keys.


### Union
```
<Type> `|` <Type>
```
The **union** operator creates a type that is either one operand, or the other, or some combination of both.
```
type T = bool | int;
val mut v: T = false;
set v = 42;
```

When accessing a *union* of record types, we can only access the *intersection* of the properties of each type.
```
type Employee = (
	name:        str,
	id:          int,
	jobTitle:    str,
	hoursWorked: float,
);
type Volunteer = (
	name:        str,
	agency:      str,
	hoursWorked: float,
);
claim bob: Employee | Volunteer;
bob.name;        %: str
bob.hoursWorked; %: float
bob.id;          %> TypeError
bob.jobTitle;    %> TypeError
bob.agency;      %> TypeError
```
Type `Employee | Volunteer` is *either* an employee *or* a volunteer,
so we’re only guaranteed it will have the properties that are present in *both* types.
With normal access, we can’t access properties that are in one type but not the other.

But with [maybe access](#maybe-access), we can access a property that exists on one type but not the other,
noting that the resulting type is unioned with `null`.
The maybe access operator will return the property value if it exists, else `null`.
```
bob?.id;       %: int | null
bob?.jobTitle; %: str | null
bob?.agency;   %: str | null
```

Overlapping properties in a union are themselves unioned.
```
type A = (
	key:    1 | 2 | 3,
	valueA: int,
);
type B = (
	key:    2 | 3 | 4,
	valueB: float,
);
claim data: A | B;
data.key; %: 1 | 2 | 3 | 4 % `(1 | 2 | 3) | (2 | 3 | 4)`
```

This holds for tuple types as well, accounting for indices rather than keys.
