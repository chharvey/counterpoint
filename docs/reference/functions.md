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
```
func computeHypotenuse(a: float, b: float): float {
	let aa: float = a ^ 2;
	let bb: float = b ^ 2;
	let cc: float = aa + bb;
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
```
let result: float = computeHypotenuse.(3.0, 4.0); % returns `5.0`
```
Named functions must be called by name. It’s a compile-time error to reference a named function without calling it.
```
computeHypotenuse || null;              %> Error
(computeHypotenuse || null).(3.0, 4.0); %> Error
```
> Error: Named function `computeHypotenuse` is not called by name.


Not all functions need to have an output when they return — those are called **void functions**.
The function below does nothing but evaluate a string when called.
Typically, void functions will have observable side-effects, such as modifying non-local variables.
```
func myVoidFunction(message: str): void {
	'''Here is the message: {{ message }}''';
	%                          ^ parameter
}
myVoidFunction.('Hello world!'); % evaluates the string
%               ^ argument
```

The difference between *parameters* and *arguments* is subtle:
parameters are unbound identifiers used in the function *definition*,
whereas arguments are values sent to the function *call*.
In the example above, `message` is a parameter, and `'Hello world!'` is an argument.
The caller of a function may supply different arguments every time the function is called.
If that function is not void, then it’s most likely going to return different outputs.
```
let x: float = computeHypotenuse.( 3.0,  4.0); % returns  `5.0`
let y: float = computeHypotenuse.( 6.0,  8.0); % returns `10.0`
let z: float = computeHypotenuse.(12.0, 16.0); % returns `20.0`
```

One of the most confusing things to understand about functions
is the difference between *defining* them and *calling* them.
When we define a function, we’re setting up the steps that *will* be performed when the function executes.
Those steps aren’t performed where they’re written, they’re performed whereever the function is executed.
To do that, we need to call it, and this could happen at a point
much farther away in our code, and it could even happen more than once.

The arguments sent into the function call must match the function’s [type signature](#type-signatures).
```
func distance(ax: float, ay: float, bx: float, `by`: float): float {
	return ((bx - ax) ^ 2 + (`by` - ay) ^ 2) ^ 0.5;
}
% typeof distance: (ax: float, ay: float, bx: float, `by`: float) => float
```
The function `distance` expects 4 arguments, all of them floats.
When we call it, we must obey that contract.
```
distance.(2.0, 3.0, 4.0, 5.0);      % about `2.828`
distance.(2.0, '3', 4.0, 5.0);      %> TypeError (str not assignable to float)
distance.(2.0, 3.0, 4.0, 5.0, 6.0); %> TypeError (too many arguments)
distance.(2.0, 3.0, 4.0);           %> TypeError (too few arguments)
```




## Function Expressions
Function expressions are not statements; rather, they’re expressions that construct new functions.
The new function object is called an **anonymous function**, because it lacks a name (in contrast to named functions).
Anonymous functions are also called **lambdas** for short.
The following is a function expression.
```
(a: int, b: int): int { return a + b; };
```
This isn’t particularly helpful — Once the function above is defined, it cannot be used.
However, we can assign it to a variable.
```
let add: (a: int, b: int) => int = (a: int, b: int): int { return a + b; };
add.(2, 3); %== `5`
```

Assigning lambdas to variables is discouraged in favor of using a function declaration,
especially if all we’re going to do with the function object is call it.
This can actually do harm if the variable is unfixed,
since it could be reassigned later and could lead to unpredictable behavior.
```
let unfixed add: (a: int, b: int) => int = (a: int, b: int): int => a + b; % allowed, but bad programming
% calling the function here will return one result...
set add = (a: int, b: int) => a - b; % reassign the function (not recommended) --- notice the mistake
% calling the function here will return a different result.
```
Calling a function at different points at runtime should not produce different results.
Furthermore, assigning a lambda to a variable requires a lot of upkeep, e.g.,
updating the parameters in both the function and the variable type declaration.
```diff
-let add: (a: int, b: int) => int = (a: int, b: int): int => a + b;
+let add: (a: int, b: int) => int = (a: float, b: float): float => a + b;
+%         ^ oops, forgot to update
```

But there are many upsides to function expressions, which will be explored throughout this chapter.
Lambdas are first-class citizens: They can be passed around and operated on, just like any other value.
This means we can do so much more with lambdas than with named functions.
For example, we can send lambdas into [higher-order functions](#higher-order-functions),
```
fold.([1, 2, 3], (a: int, b: int): int { return a + b; }); %== 6
```
we can return them as [closures](#closures),
```
func adder(augend: int): (int) => int {
	return [augend](addend: int): int { return augend + addend; };
	%      ^ this is called ‘capturing’ --- don’t worry about it for now
}
let closure: (int) => int = adder.(3);
closure.(5); %== 8
```
and we can even [define and call](#iifes) them within the same expression:
```
let value: int = ((augend: int): int { return augend + 3; }).(5);
value; %== 8
```


### IIFEs
An immediately-invoked function expression (“IIFE”) is a lambda called immediately after it’s defined.
The IIFE is called only once and then discarded.
```
((a: int, b: int): int {
	return a + b;
}).(3, 5);
```
Here, we’ve defined a lambda `(a: int, b: int) { return a + b; }`, and then called it immediately
with the arguments `3` and `5`. After this statement, the lambda can never be accessed again.
In fact, the expression evaluates to a single integer, but unless it’s assigned to a variable,
operated on, or sent somewhere, it also can’t be accessed again.

IIFEs are powerful in that they allow us to encapsulate code and hide it from the surrounding scope.
For example, inside an IIFE we can perform prerequisite computations before returning the final result.
```
let message: str = ((): str {
	let unfixed m: str = '';
	m = '''{{ m }}Hello ''';
	m = '''{{ m }}world!''';
	return m;
}).();
% m is not visible outside the function
message; %== 'Hello world!'
```



## Implicit Returns
When the body of any function (declaration or expression) contains a singular return statement,
we can use a shorthand syntax that omits the curly braces.
The returned expression follows a fat arrow `=>`. We call this an **implicit return**.
```
func add(a: int, b: int): int
	=> a + b;

let mult: (a: int, b: int) => int =
	(a: int, b: int): int => a * b;
```

The fat arrow `=>` in a function expression is *not an operator*.
The expression `(): bool => p || q` for instance has an implied grouping symbol: `(): bool => (p || q)`.
If we wanted to use an operator outside the expression,
we would have to explicitly enclose the function in grouping symbols: `((): bool => p) || q`.



## Named Arguments
The arguments we send into a function may be **named**, which only means they’re preceded by a label.
The labels indicate which of the function’s parameters the argument is assigned to.
```
func move2D(player: Player, x: float, y: float): void {
	'''Player {{ player }} has moved {{ x }} horizontally and {{ y }} vertically.''';
}

move2D.(my_player,    1.0,    2.0);
move2D.(my_player, x= 1.0, y= 2.0); % same as above
move2D.(my_player, y= 2.0, x= 1.0); % same as above

move2D.(x= 2.0, y= 1.0, my_player); % ParseError
```
Notice that not all arguments have to be named, but the arguments that *are* named
don’t have to appear in the same order as their assigned parameters.
And all named arguments *must* be given after all positional (unnamed) arguments.



## Type Signatures
Every function has a static **type signature**, which describes its input and output types.
“Type signature” is a fancy word for function type.
```
func add(a: int, b: int): int {
	return a + b;
}

% typeof add: (a: int, b: int) => int

add.(a= 2, b= 3);
```
The type signature `(a: int, b: int) => int` tells us that the function takes two parameters
whose names are `a` and `b`, each of type `int`, and it returns a value of type `int`.

Though all function definitions (both declarations and expressions) require named parameters,
type signatures do not. This allows us to specify a function type that cannot be called with named arguments.
```
let mult: (int, int) => int =
	(a: int, b: int): int { return a * b; };

% typeof mult: (int, int) => int

mult.(a= 2, b= 3); %> TypeError (cannot send named arguments)
```
This time, the parameters `a` and `b` are completely internal to the function’s implementation,
and the caller does not know their names. On the downside, the caller may only provide positional arguments.

In a type signature, either *all* of the parameters are named, or *none* of them are —
there is no mixing named and positional parameters.
The type signature of a function declaration or function expression is implicit, so its parameters are always named.
Only explicit type signatures (that is, “type expressions”) may have positional parameters.

For example, the first type signature below has named parameters —
any function assigned to that type may be called with corresponding named arguments.
The second type signature has positional parameters, so any implementations can only be called with positional arguments.
```
type BinOp1 = (left: float, right: float) => float;
type BinOp2 = (      float,        float) => float;

% assume `fn1` is of type `BinOp1`
fn1.(      1.5,        2.5); % ok
fn1.(left= 1.5, right= 2.5); % ok

% assume `fn2` is of type `BinOp2`
fn2.(      1.5,        2.5); % ok
fn2.(left= 1.5, right= 2.5); %> TypeError (cannot send named arguments)
```


### Parameter Aliasing
When assigning a function to a type signature with named parameters,
the assigned parameter order must match up with the assignee parameters.
```
type BinaryOperator = (left: float, right: float) => float;
let subtract: BinaryOperator = (x: float, y: float): float => x - y; %> TypeError
```
This errors because a caller must be able to call `subtract` with the named arguments `left` and `right`.

Function parameter syntax includes a mechanism for handling function assignment/implementation with named parameters.
In the parameter name, we use `left as x` to **alias** the real parameter `x` to the assignee parameter `left`.
```
let subtract: BinaryOperator = (left as x: float, right as y: float): float => x - y;
subtract.(left= 2.5, right= 1.5);
```
This lets the function author internally use the parameter names `x` and `y`
while still allowing the caller to call the function with named arguments `left` and `right` repectively.

Function types with positional parameters are useful when a function type needs to be implemented many times.
(For example, the parameter of a [higher-order function](#higher-order-functions) should probably
be specified with positional parameters.)
```
type BinaryOperatorUnnamed = (float, float) => float;
let add:      BinaryOperatorUnnamed = (augend:       float, addend:     float): float => augend       + addend;
let subtract: BinaryOperatorUnnamed = (minuend:      float, subtrahend: float): float => minuend      - subtrahend;
let multiply: BinaryOperatorUnnamed = (multiplicand: float, multiplier: float): float => multiplicand * multiplier;
let divide:   BinaryOperatorUnnamed = (dividend:     float, divisor:    float): float => dividend     / divisor;
```



## Higher-Order Functions
**Higher-order functions** include functions that take other functions as arguments.
(They also include functions that return functions, but those aren’t discussed in this section.)
The standard iteration operation is a higher-order function. It would have a signature like the following:
```
type IteratorFn = (list: float[], callback: (item: float) => void) => void;
```
We might implement it as so:
```
func iterate(list: float[], callback: (item: float) => void): void {
	for i from 0 to list.count do {
		callback.(item= list.[i]);
	};
}
```
And a caller might use it as so:
```
iterate.([2.0, 4.0, 8.0, 16.0], (item: float): void {
	'''2 to the {{ item }} power is {{ 2.0 ^ item }}''';
});
```
If the caller doesn’t like `item` as the callback parameter name,
they can [alias](#parameter-alaising) it to a more sensible name:
```
iterate.([2.0, 4.0, 8.0, 16.0], (item as n: float): void {
	'''2 to the {{ n }} power is {{ 2.0 ^ n }}''';
});
```
However, considering that `IteratorFn` might be implemented many times,
it’s prudent for the function author to declare the `callback` parameter with positional parameters.
That way, implementations will be less awkward.
```
type IteratorFn = (list: float[], callback: (float) => void) => void;

func iterate(list: float[], callback: (float) => void): void {
	for i from 0 to list.count do {
		% now we just can’t call `callback` with named arguments
		callback.(list.[i]);
	};
}

iterate.([2.0, 4.0, 8.0, 16.0], (n: float): void {
	% no parameter aliasing necessary
	'''2 to the {{ n }} power is {{ 2.0 ^ n }}''';
});
```



## Evaluation Strategies


### Eager Argument Evaluation
In a function call, arguments are evaluated *before* being sent.
This might be counter-intuitive for some programmers who are used to evaluation being left-to-right.
```
func sayAll(message1: str, message2: str): void {
	print.('printing...');
	print.('''{{ message1 }} {{ message2 }}''');
}
func sayHello(): str {
	print.('hello');
	return 'hello';
}
func sayHello(): str {
	print.('world');
	return 'world';
}
sayAll.(sayHello.(), sayWorld.());
```
In this example, the order of prints is:
1. `'hello'`
2. `'world'`
3. `'printing...'`
4. `'hello world'`

To emulate lazy evaluation, we can use lambdas.
```
func sayAll(message1: () => str, message2: () => str): void {
	print.('printing...');
	% call in any order you like
	let w: str = message2.();
	let h: str = message1.();
	print.('''{{ h }} {{ w }}''');
}
func sayHello(): str {
	print.('hello');
	return 'hello';
}
func sayHello(): str {
	print.('world');
	return 'world';
}
sayAll.(() => sayHello.(), () => sayWorld.());
```
1. `'printing...'`
2. `'world'`
3. `'hello'`
4. `'hello world'`


### Call-By-Sharing
All functions are **call-by-sharing**, which means that when a function is called with an object argument,
the function creates a new reference pointing to that same object.
The object is “shared” between the caller’s scope and the callee’s scope.

What this means firstly is that if the parameter is reassigned,
that reassignment is only observed *within the function’s scope*.
Outside the function, the argument sent (if it was a variable) will still point to its original value.
```
let arg: int = 42;
func reassign(unfixed param: int): void {
	param = 43;
}
reassign.(arg);
arg; % still 42, not 43
```
This contrasts to other languages that are “call-by-reference”, in which *only* the reference,
not the object, is sent into the function and thus may be reassigned by it.

Notice that a parameter must be declared `unfixed` in order for it to be reassigned.
```
func reassignBoth(unfixed a: int, b: int): void {
	a = a + 1; % ok
	b = b - 1; %> AssignmentError
}
```

Call-by-sharing also means that any mutations made to the object inside the function are
observable *outside the function’s scope* (assuming the object is of a mutable type),
since those mutations apply to the shared object.
```
let arg: mutable [int] = [42];
func mutate(param: mutable [int]): void {
	param.0 = 43;
}
mutate.(arg);
arg; % modified to [43]
```
This contrasts to “call-by-value”, where a *copy* of the object
is sent into the function so that no modifications apply to the original.
