# Expressions and Operators
This chapter describes operator syntax, semantics, and precedence in expressions.



## Summary Table
In the table below, the horizontal ellipsis character `…` represents an allowed expression.

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
			<th>1</th>
			<td>Grouping</td>
			<td>unary wrap</td>
			<td>(n/a)</td>
			<td><code>( … )</code></td>
		</tr>
		<tr>
			<th rowspan="2">2</th>
			<td>Mathematical Affirmation</td>
			<td rowspan="2">unary prefix</td>
			<td rowspan="2">right-to-left</td>
			<td><code>+ …</code></td>
		</tr>
		<tr>
			<td>Mathematical Negation</td>
			<td><code>- …</code></td>
		</tr>
		<tr>
			<th>3</th>
			<td>Exponentiation</td>
			<td>binary infix</td>
			<td>right-to-left</td>
			<td><code>… ^ …</code></td>
		</tr>
		<tr>
			<th rowspan="2">4</th>
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
			<th rowspan="2">5</th>
			<td>Addition</td>
			<td rowspan="2">binary infix</td>
			<td rowspan="2">left-to-right</td>
			<td><code>… + …</code></td>
		</tr>
		<tr>
			<td>Subtraction</td>
			<td><code>… - …</code></td>
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



## Mathematical Affirmation `+`, Mathematical Negation `-`
The **mathematical affirmation** operator, `+`,
and the **mathematical negation** operator, `-`,
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
These tokens’ values are the same as the computed values of
the expressions `-(\x200)` and `+(\x200)`,
but this is important to mention because it could affect how we write
[Additive](#parsing-additive-expressions) expressions.



## Exponentiation `^`
The **exponentiation** operator, `^`,
is valid only on number types.
It produces the result of raising the left-hand operand to the power of the right-hand operand.
Integer bases can be mixed.

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
The reason is that this is consistent with mathematical notation,
where *a<sup>b<sup>c</sup></sup>* is interpreted as *a<sup>(b<sup>c</sup>)</sup>*.


### Exponentiation: Order of Operations
In mathematics, exponents are applied before negation (which is multiplication).
However, in Solid, [mathematical negation](#mathematical-affirmation-+-mathematical-negation--)
is a unary operator, which is stronger than any binary operator.
**Mathematical negation is not considered multiplication**,
even if it indeed produces the same mathematical result of multiplying by -1.
Therefore, we can end up with confusing syntax such as this:
```
-3 ^ 2
```
While *mathematically*, *&minus;3<sup>2</sup>* is equivalent to *&minus;1&middot;3<sup>2</sup>*,
producing `-9`, the Solid expression `-3 ^ 2`, is *not equivalent*.
Mathematical negation is stronger than exponentiation, so Solid will compute `-3`
first as a unary operation, and then raise that value to the power of `2`, producing `9`.
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



## Multiplicative `*`, `/`
The **multiplication** operator, `*` and
the **division** operator, `/`,
are valid only on number types.
They produce the respective mathematical product and quotient of the operands.
Integer bases can be mixed.

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



## Additive `+`, `-`
The **addition** operator, `+`,
and the **subtraction** operator, `-`,
are valid only on number types.
They produce the respective mathematical sum and difference of the operands.
Integer bases can be mixed.

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


### Parsing Additive Expressions
[Previously in this chapter](#mathematical-affirmation-+-mathematical-negation--)
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
