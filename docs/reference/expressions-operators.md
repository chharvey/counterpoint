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
			<th rowspan="4">3</th>
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
			<th rowspan="2">4</th>
			<td>Integer Conversion</td>
			<td rowspan="2">unary prefix</td>
			<td rowspan="2">right-to-left</td>
			<td><code>int …</code></td>
		</tr>
		<tr>
			<td>Float Conversion</td>
			<td><code>float …</code></td>
		</tr>
		<tr>
			<th rowspan="4">5</th>
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
			<th>6</th>
			<td>Exponentiation</td>
			<td>binary infix</td>
			<td>right-to-left</td>
			<td><code>… ^ …</code></td>
		</tr>
		<tr>
			<th rowspan="2">7</th>
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
			<th rowspan="2">8</th>
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
			<th rowspan="8">9</th>
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
			<td><code>… isnt …</code></td>
		</tr>
		<tr>
			<th rowspan="4">10</th>
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
			<th rowspan="2">11</th>
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
			<th rowspan="2">12</th>
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
			<th>13</th>
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


### Property Access
```
<Tuple  | List> `.` int-literal
<Record | Dict> `.` word
<Object>        `.` `[` <Object> `]`

<Tuple  | List> `?.` int-literal
<Record | Dict> `?.` word
<Object>        `?.` `[` <Object> `]`

<Tuple  | List> `!.` int-literal
<Record | Dict> `!.` word
<Object>        `!.` `[` <Object> `]`
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
can be found in the [Types](./types) chapter.

#### Maybe Access
The **maybe access** syntax is almost the same as property access, except that
the operator produces the `null` value if and when there is no such bound property
on the binding object at runtime. This operator is designed to work with
optional entries on types, such as optional properties on a record type, as well as
[the `Maybe` algeraic sum type] (link pending).

Given a record `record` of type `[a: bool, b?: int]`,
the expression `record.b` would result in a crash if there’s no actual value at that location,
so the compiler raises an error when using that syntax.
Using the maybe access operator though, `record?.b` will produce the value at `record.b`
if it exists, but otherwise will produce `null` and avoid the crash.
An equivalent syntax exists for dynamic access: `map?.[expr]`, etc.

Conversely, maybe access syntax is not allowed for required properties: `record?.a` would raise a compiler error.

Note that if `foo?.bar` produces `null`, it either means that `foo.bar` does exist and is equal to `null`,
or that there’s no value for the `bar` property bound to `foo`,
and the maybe access operator is doing its job.
Thus the recommended approach is to use
[the `Maybe` discriminated union type] (link pending)
for all entries in a collection that may contain `null`.

If the *binding object is `null`*, then the maybe access operator also produces `null`.
For example, `null.property` is a type error (and if the compiler were bypassed,
it would cause a runtime error), but `null?.property` will simply produce `null`.
This facet makes maybe access safe to use when chained.

When the maybe access operator is chained, it should be chained down the line, e.g., `x?.y?.z`.
This is equivalent to `(x?.y)?.z`, and if `x?.y` (or `x.y` for that matter) is `null`,
then the whole expression also results in `null`.
However, `x?.y.z` (which can be thought of as `(x?.y).z`) is not the same,
and will result in a runtime error if `x?.y` is `null`.

**Type-Checking Note:**

For static types (e.g., tuples and records),
either the normal or maybe access operator is allowed, corresponding to the optionality of the entry being accessed.
When the maybe access operator is used for an optional entry, the entry type is unioned with `null`.
```
claim record: (required: bool, optional?: int);
record.required;  %: bool
record?.required; %> TypeErrorInvalidOperation
record.optional;  %> TypeErrorInvalidOperation
record?.optional; %: int | null
```
For dynamic types (e.g., lists and dicts),
both normal and maybe access operators are allowed.
The normal access operator treats all entries as required (does not modify the declared type), and
the maybe access operator treats all entries as optional (unions the property type with `null`).
```
claim dict: [: float];
dict.[@prop];  %: float
dict?.[@prop]; %: float | null
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
|                | `0.0`, `-0.0`    | all floats      |
|                | `""`             | all strings     |
|                | `()`, `[]`, `{}` | all collections |
|                |                  | any other value |


### Mathematical Affirmation, Mathematical Negation
```
`+` <int | float>
`-` <int | float>
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
let int_p = 512;
let int_n = -\x200;

+int_p; %== 512
+int_n; %== -512

-int_p; %== -512
-int_n; %== 512
```

Recognize that number tokens can begin with **U+002B PLUS SIGN** or **U+002D HYPHEN-MINUS**,
even if they’re prefixed with a radix.
For example, `-\x200` is lexed as a single token, and not two tokens `-` and `\x200`.
The same is true for `+\x200`.
Even though these tokens’ values are the same as the computed values of
the expressions `-(\x200)` and `+(\x200)`,
this is important to mention because it could affect how we write
[additive expressions](#parsing-additive-expressions).


### Numeric Conversions
```
int   <Number>
float <Number>
```
The keywords `int` and `float` can also be used as unary prefix operators.
They convert their numeric operand into their respective type. If the operand is not numeric, a type error is raised.
```
let my_int: int   = 7;
let my_flt: float = -3.5;

2 * int my_flt;     % converts -3.5 to -3; result is same as `2 * -3`
float my_int / 3.5; % converts 7 to 7.0; result is same as `7.0 / 3.5`
```
When converting floats to integers, the “round-toward-zero” (truncation) method is used.
Both `-0.0` and `0.0` convert to `0`.
If the floating-point number is greater than the maximal integer *2^63 &minus; 1*, the maximal integer is returned;
likewise for less than the minimal integer *&minus;2^63*.
For NaN and other unrepresentable values, an error is raised.

When converting integers to floats, some precision will be lost for integers greater than *2^53*, as per the *IEEE 754* specification.


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
let var item: [str, ?: int] = ["apples", 42];
let quantity: int = item?.1~?;
```
Since `item.1` is optional, `item?.1` is of type `int | null`.
By using the non-null assertion `~?`, we can subtract type null.

The more general form of this is simply claiming that `item?.1` is of type `int`:
```
let var item: [str, ?: int] = ["apples", 42];
let quantity: int = item?.1 as <int>;
```

Type claims can be used in situations where non-null assertion cannot.
Whereas non-null assertions can only tell the compiler that a property *exists*,
type claims can widen, narrow, or shift the type of an expression.
```
let var item: [str, int | str] = ["apples", 42];
let ingredient: anything   = item.0 as <anything>;   % widening
let quantity:   int        = item.1 as <int>;        % narrowing
let in_stock:   int | bool = item.1 as <int | bool>; % shifting
```

The compiler will throw an error when encountering a type claim if its operand’s computed type
and its claimed type are disjoint (i.e. if there’s no overlap).
```
42 as <str>; %> TypeError
```

#### Cast vs Claim
A runtime cast (`expr as Klass`) will always check whether `Klass` is a class, and whether `expr` is actually an instance of it at runtime;
if not, then the program throws. This operator is preferred in such circumstances.
```
let animal: Animal = Cat.();
let cat: Cat = animal as Cat; % cast is allowed (`Cat` can be converted to `Cat`)
cat.meow.();                  % calls `meow` on the `Cat` instance

let dog: Dog = animal as Dog; % throws error: `Cat` cannot be converted to `Dog`
dog.woof.();                  % unreachable
```
The `as?` and `as!` casts can be useful in tandem with maybe/result access respectively.
```
let cat_m: Maybe.<Cat> = animal as? Cat; %== Some.<Cat>
cat_m?.meow.();                          % calls `meow`

let dog_m: Maybe.<Dog> = animal as? Dog; %== None
dog_m?.woof.();                          %== None

let cat_r: Result.<Cat> = animal as! Cat; %== Ok.<Cat>
cat_r!.meow.();                           % calls `meow`

let dog_r: Result.<Dog> = animal as! Dog; %== Fail
dog_r?.woof.();                           %== Fail
```


A compile-time claim (`expr as <Klass>`) *claims* to the type-checker that `expr` is already of type `Klass`,
but no double-check is performed at runtime. The program will proceed as usual, assuming `expr` is assignable to type `Klass`.
That means that if it’s *not* such an instance, an error could be thrown down the line,
for example, when attempting to access a nonexistent method.
```
let animal: Animal = Cat.();
let cat: Cat = animal as <Cat>; % claim is allowed (`Animal` and `Cat` overlap)
cat.meow.();                    % calls `meow` on the `Cat` instance

let dog: Dog = animal as <Dog>; % claim is allowed (`Animal` and `Dog` overlap)
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
<int | float> `^` <int | float>
```
The **exponentiation** operator is valid only on number types.
It produces the result of raising the left-hand operand to the power of the right-hand operand.
Integer bases as well as integers and floats can be mixed.

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
<int | float> `*` <int | float>
<int | float> `/` <int | float>
```
The **multiplication** operator, `*`, and
the **division** operator, `/`,
are valid only on number types.
They produce the respective mathematical product and quotient of the operands.
Integer bases as well as integers and floats can be mixed.

Multiplication is **associative**, which means the following expressions produce the same result,
for any numbers `‹a›`, `‹b›`, and `‹c›`:
```
‹a› * ‹b› * ‹c›
(‹a› * ‹b›) * ‹c›
‹a› * (‹b› * ‹c›)
```

Multiplication and division perform the standard arithmetic operations,
keeping in mind that the result of division `/` on integers are truncated,
and division by `0` will result in an error.
```
\o12 / \q11; % produces `2`
3 / 2;       % produces `1`, since 1.5 gets truncated
4 / 0;       % runtime error
```


### Additive
```
<int | float> `+` <int | float>
<int | float> `-` <int | float>
```
The **addition** operator, `+`, and
the **subtraction** operator, `-`,
are valid only on number types.
They produce the respective mathematical sum and difference of the operands.
Integer bases as well as integers and floats can be mixed.

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

To fix the error, we must use whitespace indicate token boundaries.
```
3 + 1
```
Now the lexer produces three tokens: a number `3`, a punctuator `+`, and a number `1`.
The parser receives these tokens and produces the correct expression.
(Note that the code `3+ 1` would be sufficient, but perhaps not as readable.)


### Comparative
```
<int | float> `<`  <int | float>
<int | float> `>`  <int | float>
<int | float> `<=` <int | float>
<int | float> `>=` <int | float>
<int | float> `!<` <int | float>
<int | float> `!>` <int | float>

<Object> `is`   <Class>
<Object> `isnt` <Class>
```
The numerical comparative operators,

- **less than** `<`
- **greater than** `>`
- **less than or equal to** `<=`
- **greater than or equal to** `>=`
- **not less than** `!<`
- **not greater than** `!>`

compare number types in the usual sense. The result is a boolean value.
Integer bases as well as integers and floats can be mixed.

In numerical uses, `!<` is equivalent to `>=`, and `!>` is equivalent to `<=`.
In general, however, this might not hold for future operator overloads.
For instance, if the relational operators were overloaded to mean “subset” for sets,
then `a !< b` (“`a` is not a strict subset of `b`”) does not necessarily mean
that `a >= b` (“`a` is a superset of ”).

The object comparative operators `is` and `isnt` are not currently available,
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
For `null`, boolean, and string values, equality is one in the same with identity.
For number values, equality is determined by mathematical quantity, thus `0.0 == -0.0` is `true`.
Mixed number types of the same quantity are equal, so `42 == 42.0` is also `true`.

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
assume equal until determined otherwise.


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


### Nullish
```
<Type> `?`
```
The **nullish** operator creates a [union](#union) of the operand and the `null` type.
```
type T = int?; % equivalent to `type T = int | null;`
```
This operator is useful for describing values that might be null.
```
let var hello: str? = null;
set hello = "world";
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
let elements: mut str{} = {"water", "earth", "fire", "wind"};
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
let v: T = (
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
let var v: T = false;
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
