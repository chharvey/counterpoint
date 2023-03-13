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
			<td>Optional Access</td>
			<td><code>… ?. …</code></td>
		</tr>
		<tr>
			<td>Computed Optional Access</td>
			<td><code>… ?.[ … ]</code></td>
		</tr>
		<tr>
			<td>Claim Access</td>
			<td><code>… !. …</code></td>
		</tr>
		<tr>
			<td>Computed Claim Access</td>
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
			<th>4</th>
			<td>Exponentiation</td>
			<td>binary infix</td>
			<td>right-to-left</td>
			<td><code>… ^ …</code></td>
		</tr>
		<tr>
			<th rowspan="2">5</th>
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
			<th rowspan="2">6</th>
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
			<th rowspan="8">7</th>
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
			<th rowspan="4">8</th>
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
			<th rowspan="2">9</th>
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
			<th rowspan="2">10</th>
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
			<th>11</th>
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
Read about Tuples, Records, Sets, and Maps in the [Types](./types.md) chapter.


### Property Access
```
<obj> `.` int-literal
<obj> `.` word
<obj> `.` `[` <obj> `]`

<obj> `?.` int-literal
<obj> `?.` word
<obj> `?.` `[` <obj> `]`

<obj> `!.` int-literal
<obj> `!.` word
<obj> `!.` `[` <obj> `]`
```
The **property accesss** syntax is a unary operator on an object.
The object it operates on is called the **binding object** and
the property it accesses is called the **bound property** (or index, field, member, etc.).
There are two flavors of the operator: literal access and computed access.

Literal access requires a literal (integer or word) and can be used to access a literal bound property.
Tuples/lists take integer literal properties and records/dicts take word (key) properties.
For example: `tuple.3` and `record.prop`.

Computed access must be used when the bound property name is computed,
such as an operation of expressions, e.g., `map.[expr]`.
The expression in the brackets evaluates to an item index, element, or case antecedent
of the binding object and must be of the correct type.

More information about property access when used on collections
can be found in the [Types](./types) chapter.

#### Optional Access
The **optional access** syntax is almost the same as property access, except that
the operator produces the `null` value if and when there is no such bound property
on the binding object at runtime. This operator is designed to work with
optional entries on types, such as optional properties on a record type.

Given a record `record` of type `[a: bool, b?: int]`,
the expression `record.b` will produce that value if it exists,
but will result in a runtime error if there’s no actual value at that location.
Using the optional access operator though, `record?.b` will produce `record.b`
if it exists, but otherwise will produce `null` and avoid the error.
An equivalent syntax exists for dynamic access: `map?.[expr]`, etc.

Note that if `foo?.bar` produces `null`, it either means that `foo.bar` does exist and is equal to `null`,
or that there’s no value for the `bar` property bound to `foo`,
and the optional access operator is doing its job.

If the *binding object is `null`*, then the optional access operator also produces `null`.
For example, `null.property` is a type error (and if the compiler were bypassed,
it would cause a runtime error), but `null?.property` will simply produce `null`.
This facet makes optional access safe to use when chained.

When the optional access operator is chained, it should be chained down the line, e.g., `x?.y?.z`.
This is equivalent to `(x?.y)?.z`, and if `x?.y` (or `x.y` for that matter) is `null`,
then the whole expression also results in `null`.
However, `x?.y.z` (which can be thought of as `(x?.y).z`) is not the same,
and will result in a runtime error if `x?.y` is `null`.

#### Claim Access
The **claim access** syntax is just like regular property access, except that
it makes a **claim** (a compile-time type assertion) that the accessed property
is not of type `void`. This is useful when accessing optional entries of compound types.

Claim access has the same runtime behavior of regular property access.
Its purpose is to tell the type-checker,
“I know what I’m doing; This property exists and its type is not type `void`.”
```
let unfixed item: [str, ?: int] = ['apples', 42];
let quantity: int = item!.1;
```
The expression `item!.1` has type `int`, despite being an optional entry.
It will produce the value `42` at runtime.
Note that bypassing the compiler’s type-checking process should be done carefully.
If not used correctly, it could lead to runtime errors.
```
let unfixed item: [str, ?: int] = ['apples'];
let quantity: int = item!.1; % runtime error!
```
An equivalent syntax exists for dynamic access: `item!.[expr]`, etc.


### Logical Negation, Emptiness
```
`!` <unknown>
`?` <unknown>
```
The **logical negation** operator, `!`, returns the opposite boolean value of the operand’s “logical value”.

A value’s “logical value” is the boolean value that most closely corresponds to that value.
A value is said to be “falsy” if its “logical value” is `false`. Otherwise the value is said to be “truthy”.

The operator `!` logically negates the “logical value” of the operand.
If the value is “falsy”, `true` is produced; otherwise `false` is produced.

The **emptiness operator**, `?`, determines whether a value is considered “empty”.
A value is “empty” if it’s “falsy”, if it’s a zero numeric value (`0`, `0.0`, or `-0.0`),
or if it’s an empty string or empty collection (such as an array or set).

| “Falsy” Values | “Empty” Values | “Truthy” Values |
| -------------- | -------------- | --------------- |
| `null`         | `null`         |                 |
| `false`        | `false`        | `true`          |
|                | `0`            | all integers    |
|                | `0.0`, `-0.0`  | all floats      |
|                | `''`           | all strings     |
|                | `[]`, `{}`     | all collections |
|                |                | any other value |


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

<obj> `is`   <obj>
<obj> `isnt` <obj>
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
<unknown> `===`  <unknown>
<unknown> `!==`  <unknown>
<unknown> `==`   <unknown>
<unknown> `!=`   <unknown>
```
These operators compare two values.
Any type of operands are valid. The result is a boolean value.
Integer bases as well as integers and floats can be mixed.

The **identity** operator `===` determines whether two operands are the exactly same object.
It produces `true` if and only if both operands are references to (point to) the same object in memory.
Primitive values such as `null`, boolean values, number values, and string values
only exist once, so any two of “the same” values will be identical.
For other types, identity and equality might not necessarily be the same:
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


### Conjunctive
```
<unknown> `&&` <unknown>
<unknown> `!&` <unknown>
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
<unknown> `||` <unknown>
<unknown> `!|` <unknown>
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
`if` <bool> `then` <unknown> `else` <unknown>
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
			<td><code>mutable …</code></td>
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
Read about Tuples, Records, Sets, and Maps in the [Types](./types.md) chapter.


### Type Property Access
```
<Type> `.` int-literal
<Type> `.` word
```
The **type property accesss** syntax for types is analogous to the property access syntax of values.
It accesses the index or key of a tuple or record type respectively.
```
type T = [bool, int, str];
type T1 = T.1;             %== int
type T_1 = T.-1;           %== str
type T3 = T.3;             %> TypeError

type R = [a: bool, b?: int, c: str];
type Ra = R.a;                       %== bool
type Rc = R.b;                       %== int | void
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
let unfixed hello: str? = null;
hello = 'world';
```


### TBA
```
<Type> `!`
```
To be announced.


### List
```
<Type> `[]`
```
The **List** operator `T[]` is shorthand for `List.<T>`.


### Tuple
```
<Type> `[` <Integer> `]`
```
The **Tuple** operator `T[‹n›]` (where `‹n›` is 0 or greater) is shorthand for a tuple type with repeated entries of `T`.
E.g., `int[3]` is shorthand for `[int, int, int]`.


### Set
```
<Type> `{}`
```
The **Set** operator `T{}` is shorthand for `Set.<T>`.


### Mutable
```
`mutable` <Type>
```
The `mutable` type operator allows properties in a complex type to be reassigned.
It allows us to reassign tuple indices and record keys, as well as modify sets and maps
by adding, removing, and changing entries.
It will also allow us to reassign fields and call mutating methods on class instances.
```
let elements: mutable str[4] = ['water', 'earth', 'fire', 'wind'];
elements.3 = 'air';
elements; %== ['water', 'earth', 'fire', 'air']
```
If `elements` were just of type `str[4]` (without `mutable`),
then attempting to modify it would result in a Mutability Error.


### Intersection
```
<Type> `&` <Type>
```
The **intersection** operator creates a strict combination of the operands.
```
type T = [foo: bool] & [bar: int];
let v: T = [
	foo= false,
	bar= 42,
];
```

When accessing an *intersection* of record types, we can access the *union* of the properties of each type.
```
type Employee = [
	name:        str,
	id:          int,
	jobTitle:    str,
	hoursWorked: float,
];
type Volunteer = [
	name:        str,
	agency:      str,
	hoursWorked: float,
];
% claim alice: Employee & Volunteer;
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
type A = [
	key:    1 | 2 | 3,
	valueA: int,
];
type B = [
	key:    2 | 3 | 4,
	valueB: float,
];
% claim data: A & B;
data.key;    %: 2 | 3 % `(1 | 2 | 3) & (2 | 3 | 4)`
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
let unfixed v: T = false;
v = 42;
```

When accessing a *union* of record types, we can only access the *intersection* of the properties of each type.
```
type Employee = [
	name:        str,
	id:          int,
	jobTitle:    str,
	hoursWorked: float,
];
type Volunteer = [
	name:        str,
	agency:      str,
	hoursWorked: float,
];
% claim bob: Employee | Volunteer;
bob.name;        %: str
bob.hoursWorked; %: float
bob.id;          %> TypeError
bob.jobTitle;    %> TypeError
bob.agency;      %> TypeError
```
Type `Employee | Volunteer` is *either* an employee *or* a volunteer,
so we’re only guaranteed it will have the properties that are present in *both* types.
We can’t access properties that are in one type but not the other.

Overlapping properties in a union are themselves unioned.
```
type A = [
	key:    1 | 2 | 3,
	valueA: int,
];
type B = [
	key:    2 | 3 | 4,
	valueB: float,
];
% claim data: A | B;
data.key; %: 1 | 2 | 3 | 4 % `(1 | 2 | 3) | (2 | 3 | 4)`
```

This holds for tuple types as well, accounting for indices rather than keys.
