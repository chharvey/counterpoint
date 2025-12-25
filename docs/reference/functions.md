# Functions
Functions are objects that encapsulate a set of procedures to be executed later.
A function may be parameterized (which means it takes inputs), and it may return a value (produce an output).
In this way, Counterpoint functions and mathematical functions have some basic similarities.

Mathematical functions are necessarily pure, stateless, and deterministic, but Counterpoint functions need not be.

- A **pure function** does not modify its inputs or any non-local variables.
- A **stateless function** has no knowledge of any non-local variables.
- A **deterministic function** returns the same output each time it is called with the same inputs.

There are two ways to define functions: function declarations and function expressions.



## Function Declarations
Function declarations are statements that declare and construct new functions.
The new function object is called a **named function** because it’s given an identifier when constructed
and it must be called by name.
The following statement is a function declaration.
```cpl
func compute_hypotenuse(a: float, b: float): float {
	val aa: float = a ^ 2;
	val bb: float = b ^ 2;
	val cc: float = aa + bb;
	return cc ^ 0.5;
}
```
The function body defines what code to execute when the function is called.
The function above takes 2 **parameters**, or “inputs”, which may be accessed in the function body.
In the function body, we declare 3 variables and return a value.
Function bodies are scoped, so the variables won’t be visible from the outside.
The **return statement** declares the return value, or “output”, which is produced when the function is done executing.

To execute the function, we have to **call** it. Calling a function involves sending in **arguments**,
which are values used as its inputs. When the function returns, it usually returns a result.
```cpl
val result: float = compute_hypotenuse.(3.0, 4.0); %=> 5.0
```
Named functions must be called by name. It’s a compile-time error to reference a named function without calling it.
```cpl
compute_hypotenuse || null;              %> Error
(compute_hypotenuse || null).(3.0, 4.0); %> Error
```
> Error: Named function `compute_hypotenuse` is not called by name.


Not all functions need to have an output when they return — those are called **void functions**.
The body of a void function *must* include a return statement in every code path —
whether it be an empty `return;` statement or a statement that returns another void function call.
The function below does nothing but evaluate a string when called.
Typically, void functions will have observable side-effects, such as modifying non-local variables.
```cpl
func myVoidFunction(message: str): void {
	"""Here is the message: {{ message }}""";
	%                          ^ parameter
	return;
}
myVoidFunction.("Hello world!"); % evaluates the string
%               ^ argument
```

The difference between *parameters* and *arguments* is subtle:
parameters are unbound identifiers used in the function *definition*,
whereas arguments are values sent to the function *call*.
In the example above, `message` is a parameter, and `"Hello world!"` is an argument.
The caller of a function may supply different arguments every time the function is called.
If that function is not void, then it’s most likely going to return different outputs.
```cpl
val x: float = compute_hypotenuse.( 3.0,  4.0); %=>  5.0
val y: float = compute_hypotenuse.( 6.0,  8.0); %=> 10.0
val z: float = compute_hypotenuse.(12.0, 16.0); %=> 20.0
```

One of the most confusing things to understand about functions
is the difference between *defining* them and *calling* them.
When we define a function, we’re setting up the steps that *will* be performed when the function executes.
Those steps aren’t performed where they’re written, they’re performed wherever the function is executed.
To do that, we need to call it, and this could happen at a point
much farther away in our code, and it could even happen more than once.

The arguments sent into the function call must match the function’s [type signature](#type-signatures).
```cpl
func distance(ax: float, ay: float, bx: float, 'by': float): float {
	return ((bx - ax) ^ 2 + ('by' - ay) ^ 2) ^ 0.5;
}
% typeof distance: \(ax: float, ay: float, bx: float, 'by': float) => float
```
The function `distance` expects 4 arguments, all of them floating-point values.
When we call it, we must obey that contract.
```cpl
distance.(2.0, 3.0, 4.0, 5.0);      % about `2.828`
distance.(2.0, "3", 4.0, 5.0);      %> TypeError (str not assignable to float)
distance.(2.0, 3.0, 4.0, 5.0, 6.0); %> TypeError (too many arguments)
distance.(2.0, 3.0, 4.0);           %> TypeError (too few arguments)
```



## Function Expressions
Function expressions are not statements; rather, they’re expressions that construct new functions.
The new function object is called an **anonymous function**, because it lacks a name (in contrast to named functions).
Anonymous functions are also called **lambdas** for short.
The following is a function expression.
```cpl
\(a: int, b: int): int { return a + b; };
```
This isn’t particularly helpful — Once the function above is defined, it cannot be used.
However, we can assign it to a variable.
```cpl
val add: \(a: int, b: int) => int = \(a: int, b: int): int { return a + b; };
add.(2, 3); %== 5
```

Assigning lambdas to variables is discouraged in favor of using a function declaration,
especially if all we’re going to do with the function object is call it.
This can actually do harm if the variable is unfixed,
since it could be reassigned later and could lead to unpredictable behavior.
```cpl
val mut add: \(a: int, b: int) => int = \(a: int, b: int): int { return a + b; }; % allowed, but bad programming
% calling the function here will return one result...
set add = \(a: int, b: int): int { return a - b; }; % reassign the function (not recommended) --- notice the mistake
% calling the function here will return a different result.
```
Calling a function at different points at runtime should not produce different results.
Furthermore, assigning a lambda to a variable requires a lot of upkeep, e.g.,
updating the parameters in both the function and the variable type declaration.
```diff
-val add: \(a: int, b: int) => int = \(a: int, b: int): int => { return a + b; };
+val add: \(a: int, b: int) => int = \(a: float, b: float): float => { return a + b; };
+%         ^ oops, forgot to update
```

But there are many upsides to function expressions, which will be explored throughout this chapter.
Lambdas are first-class citizens: They can be passed around and operated on, just like any other value.
This means we can do so much more with lambdas than with named functions.
For example, we can send lambdas into [higher-order functions](#higher-order-functions),
```cpl
fold.([1, 2, 3], \(a: int, b: int): int { return a + b; }); %== 6
```
we can return them as [closures](#closures),
```cpl
func adder(augend: int): \(int) => int {
	return \[augend](addend: int): int { return augend + addend; };
	%       ^ this is called ‘capturing’ --- don’t worry about it for now
}
val closure: \(int) => int = adder.(3);
closure.(5); %== 8
```
and we can even [define and call](#iifes) them within the same expression:
```cpl
val value: int = (\(augend: int): int { return augend + 3; }).(5);
value; %== 8
```


### IIFEs
An immediately-invoked function expression (“IIFE”) is a lambda called immediately after it’s defined.
The IIFE is called only once and then discarded.
```cpl
val eight: int = (\(a: int, b: int): int {
	return a + b;
}).(3, 5);
```
Here, we’ve defined a lambda `\(a: int, b: int) { return a + b; }`, and then called it immediately
with the arguments `3` and `5`. After this statement, the lambda can never be accessed again.

IIFEs are powerful in that they allow us to encapsulate code and hide it from the surrounding scope.
For example, inside an IIFE we can perform prerequisite computations before returning the final result.
```cpl
val message: str = (\(): str {
	val mut m: str = "";
	set m = """{{ m }}Hello """;
	set m = """{{ m }}world!""";
	return m;
}).();
% `m` is not visible outside the function
message; %== "Hello world!"
```



## Implicit Returns
When the body of any function (declaration or expression) contains a singular return statement,
we can use a shorthand syntax that omits the curly braces.
The returned expression follows a fat arrow `=>`. We call this an **implicit return**.
```cpl
func add(a: int, b: int): int
	=> a + b;

val mult: \(a: int, b: int) => int =
	\(a: int, b: int): int => a * b;
```

The fat arrow `=>` in a function expression is *not an operator*.
The expression `\(): bool => p || q` for instance has an implied grouping symbol: `\(): bool => (p || q)`.
If we wanted to use an operator outside the expression,
we would have to explicitly enclose the function in grouping symbols: `(\(): bool => p) || q`.



## Named Parameters and Arguments
A function’s parameter list determines a contract that its caller must follow.
This includes not only the *types* required of the arguments, but also whether
they be **positonal** (unnamed and ordered) or **named** (and unordered).

```cpl
func compute_hypotenuse($a: float, $b: float): float {
	val aa: float = a ^ 2;
	val bb: float = b ^ 2;
	val cc: float = aa + bb;
	return cc ^ 0.5;
}
```
We made one tiny change to our `compute_hypotenuse` function by prepending each argument with a `$` symbol
(doing so is known as **punning**).
This means the argument is named, and its **external name** — the name the caller gives it —
is the same as its **internal name** — the name referenced in the function body.
When called, the arguments *must* be named: preceded by a label, which indicates
the corresponding parameter to which the argument is assigned.
```cpl
compute_hypotenuse.(a= 3.0, b= 4.0); %=>  5.0
compute_hypotenuse.(b= 8.0, a= 6.0); %=> 10.0
compute_hypotenuse.(3.0, 4.0);       %> TypeError
```
Notice that we may send named arguments in any order; they don’t need to be the same order as in the function definition.
It’s a type error to give positional arguments for named parameters or vice versa.

If we want to use different external parameter names than those used internally,
we can **alias** the internal name to an external name with a `=` symbol.
Our new `distance` function uses the external parameter names `x1`, `x2`, `y1`, and `y2`,
while maintaining internal parameter names of `ax`, `ay`, `bx`, and `'by'`.
```cpl
%%%
Gives the distance between two points (x1, x2) and (y1, y2).
%%%
func distance(x1= ax: float, x2= ay: float, y1= bx: float, y2= 'by': float): float {
	return ((bx - ax) ^ 2 + ('by' - ay) ^ 2) ^ 0.5;
}
% typeof distance: \(x1: float, x2: float, y1: float, y2: float) => float

distance.(x1= 2.0, x2= 3.0, y1= 4.0, y2= 5.0);
```

When a function parameter uses the `$param` syntax (shorthand for `param= param`),
we sometimes say it is “punned” as opposed to “aliased”.

A function may have both positional and named parameters, but all named parameters *must* come after all positional parameters.
Accordingly, all named arguments *must* be given after all positional arguments.
However, within the named parameters, punned and un-punned parameters may be intermixed;
and the named arguments may be given in any order.
```cpl
func foo(a: int, b: int, $c: int, delta= d: int, $e: int): void { return; }
foo.(1, 2, delta= 4, c= 3, e= 5);
```



## Type Signatures
Every function has a static **type signature**, which describes its input and output types as well as its calling contract.
```cpl
func add(a: int, b: int): int {
	return a + b;
}
func subtract($a: int, subtrahend= b: int): int {
	return a - b;
}

% typeof add: \(int, int) => int
% typeof subtract: \(a: int, subtrahend: int) => int

add.(2, 3);
subtract.(subtrahend= 3, a= 2);
```
The type signature `\(int, int) => int` tells us that the function takes two parameters,
each of type `int`, and it returns a value of type `int`.
The signature `\(a: int, subtrahend: int) => int`, is basically the same, but it includes the parameters’ external names `a` and `subtrahend`.

When parameters are positional like in `add` above, they are completely internal to the function’s implementation,
and the caller does not know their names. This provides good encapsulation, but it also means the caller may only provide positional arguments.
However, it does not mean *documentation* cannot provide good naming.
If authors want, they may document the parameter names in the function’s commentdoc so consumers know which order to provide them in.
```cpl
%%%
Divide two numbers.
@param  dividend the number to divide (the numerator)
@param  divisor  the number to divide *by* (the denominator)
@return `dividend / divisor`, assuming `divisor != 0.0`
%%%
func divide(a: float, b: float): float { ... }

% typeof divide: \(float, float) => float
```


### Function Assignment and Variance
Function return types are **covariant**, meaning that the *assigned* (source) function’s return type
must be a subtype of the *assignee* (target) function’s return type.
```cpl
type Stringify = \(int | float) => str;

claim f: Stringify;
val result: str = f.(42); % expected to return type `str`

val g: Stringify = \(n: int | float): str | null {...}; %> TypeError % return type `str | null` is not assignable to return type `str`
```
Conversely, function parameter types are **contravariant**, meaning that the *assignee* (target) function’s parameters
must be assignable to the *assigned* (source) function’s parameters.
```cpl
type Stringify = \(int | float) => str;

claim f: Stringify;
f.(4.2); % expected to accept type `float`

val g: Stringify = \(n: int): str {...}; %> TypeError % parameter type `int | float` is not assignable to parameter type `int`
```

Aside from the parameter *types* being compatible, the parameter positions and names are also taken into account.
For positional parameters, the rules of tuple type assignment apply; for named parameters, the rules of record assignment apply.

Like tuple assignment, positional parameters are matched in the same order.
```cpl
type BinaryOperator = \(int, float) => void;
val add: BinaryOperator = \(x: float, y: int): void { float y + x; return; }; %> TypeError
```
> TypeError: Type `\(float, int) => void` is not assignable to type `\(int, float) => void`.

One should expect to be able to call any `BinaryOperator` with the positional arguments of an `int` followed by a `float`;
providing the arguments in a different order would fail. The `add` function must switch its parameters to fix it.

Like record assignment, named parameters are matched up by key.
```cpl
type BinaryOperator = \(first: float, second: float) => void;
val subtract: BinaryOperator = \($x: float, $y: float): void { x - y; return; }; %> TypeError
```
> TypeError: Type `\(x: float, y: float) => void` is not assignable to type `\(first: float, second: float) => void`.

This fails because a caller must be able to call `subtract` with the named arguments `first` and `second`.
To fix this, we can either rename the parameters, or [alias](#named-parameters-and-arguments) them with the correct external names.

Parameter assignment in a nutshell (assigning function type `G` to function type `F`):
- positional parameters are matched up one-by-one by index
- named parameters are matched up one-by-one by key, and they don’t need to be in the same order
- every required parameter in `G` must have a corresponding required parameter in `F`
- every optional parameter in `G` may or may not have a corresponding parameter, required or optional, in `F`
- any additional parameters in `F` not corresponding to any parameters in `G` may be optional or required
- for corresponding parameters, the parameter in `G` must be a supertype of its corresponding parameter in `F`



## Higher-Order Functions
**Higher-order functions** include functions that take other functions as arguments.
(They also include functions that return functions, but those aren’t discussed in this section.)
The standard iteration operation is a higher-order function. It would have a signature like the following:
```cpl
type IteratorFn = \(list: [float], callback: \(item: float) => void) => void;
```
We might implement it as so:
```cpl
func iterate(list: [float], callback: \(item: float) => void): void {
	for val: float in list do {
		callback.(item= val);
	};
	return;
}
```
And a caller might use it as so:
```cpl
iterate.([2.0, 4.0, 8.0, 16.0], \($item: float): void {
	"""2 to the {{ item }} power is {{ 2.0 ^ item }}""";
	return;
});
```
If the caller doesn’t like `item` as the callback parameter name,
they can [alias](#named-parameters-and-arguments) it to a more sensible name:
```cpl
iterate.([2.0, 4.0, 8.0, 16.0], (item= n: float): void {
	"""2 to the {{ n }} power is {{ 2.0 ^ n }}""";
	return;
});
```
However, considering that `IteratorFn` might be implemented many times,
it’s prudent for the function author to declare the `callback` parameter with positional parameters.
That way, implementations will be less awkward.
```cpl
type IteratorFn = \(list: [float], callback: \(float) => void) => void;

func iterate(list: [float], callback: \(float) => void): void {
	for val: float in list do {
		% now we just can’t call `callback` with named arguments
		callback.(val);
	};
	return;
}

iterate.([2.0, 4.0, 8.0, 16.0], \(n: float): void {
%                                 ^ no parameter aliasing necessary
	"""2 to the {{ n }} power is {{ 2.0 ^ n }}""";
	return;
});
```



## Evaluation Strategies


### Eager Argument Evaluation
In a function call, arguments are evaluated *before* being sent.
This might be counter-intuitive for some programmers who are used to evaluation being deferred to inside the function call.
```cpl
func say_all(message1: str, message2: str): void {
	print.("printing...");
	return print.("""{{ message1 }} {{ message2 }}""");
}
func say_hello(): str {
	print.("hello");
	return "hello";
}
func say_world(): str {
	print.("world");
	return "world";
}
say_all.(say_hello.(), say_world.());
```
In this example, the order of prints is:
1. `"hello"`
2. `"world"`
3. `"printing..."`
4. `"hello world"`

To emulate lazy evaluation, we can use lambdas.
```cpl
func say_all(message1: \() => str, message2: \() => str): void {
	print.("printing...");
	% call in any order you like
	val w: str = message2.();
	val h: str = message1.();
	return print.("""{{ h }} {{ w }}""");
}
func say_hello(): str {
	print.("hello");
	return "hello";
}
func say_world(): str {
	print.("world");
	return "world";
}
say_all.(() => say_hello.(), () => say_world.());
```
1. `"printing..."`
2. `"world"`
3. `"hello"`
4. `"hello world"`


### Call-By-Sharing
All functions are **call-by-sharing**, which means that when a function is called with a reference object argument,
the function creates a new reference pointing to that same object.
The object is “shared” between the caller’s scope and the callee’s scope.

What this means firstly is that if the parameter is reassigned,
that reassignment is only observed *within the function’s scope*.
Outside the function, the argument sent (if it was a variable) will still point to its original value.
```cpl
val arg: int = 42;
func reassign(var param: int): void {
	set param = 43;
}
reassign.(arg);
arg; % still 42, not 43
```
This contrasts to other languages that are “call-by-reference”, in which *only* the reference,
not the object, is sent into the function and thus may be reassigned by it.

Notice that a parameter must be declared `var` in order for it to be reassigned.
(When an unfixed parameter is “punned”, it uses the syntax `var $param`.)
```cpl
func reassign_demo(var a: int, b: int, var $c: int, delta= var d: int): void {
	set a += 1; % ok
	set b -= 1; %> AssignmentError
	set c += 1; % ok
	set d -= 1; % ok
	return;
}
reassign_demo.(1, 2, c= 3, delta= 4);
```

Call-by-sharing also means that any mutations made to the object inside the function are
observable *outside the function’s scope* (assuming the object is of a mutable type),
since those mutations apply to the shared object.
```cpl
val arg: mut [int] = [42];
func mutate(param: mut [int]): void {
	set param.[0] = 43;
	return;
}
mutate.(arg);
arg; % modified to `[43]`
```
This contrasts to “call-by-value”, where a *copy* of the object
is sent into the function so that no modifications apply to the original.
