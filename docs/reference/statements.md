# Statements
This chapter describes statements that dictate control flow.

Control statements let programmers explicitly dictate a program’s control flow.
They are procedural and require imperative thinking about how tasks are executed.
This kind of fine-tuning is sometimes necessary, because it has particular advantages over a functional approach.



## Expression-Statements
An expression-statement is simply a statement that contains just one expression.
Its expression is evaluated, and then its value is dropped.
```cpl
14 + 28;
"hello";
print.("a function call is an expression.");
```



## Declarations, Reassignments, Deletions, and Claim Statements
See the [Variables](./variables.md) chapter.



## Blocks and Scoping
A block is a set of statements encapsulated in its own scope.
Types, variables, functions, classes, interfaces, and all other declarations are scoped to a block.
This means that they are accessible within the block (and any sub-blocks), but inaccessible from outside the block.

Blocks also forbid **shadowing**, which is the malpractice of declaring a variable (or any other symbol)
of the same name as one that is visible from the parent block.



## Conditional Statements
```
`if` <bool> `then` Block `;`
`if` <bool> `then` Block `else` Block `;`
`if` <bool> `then` Block `else` `if` <bool> `then` Block `else` Block `;`
`if` <bool> `then` Block `else` `if` <bool> `then` Block `else` `if` … `;`

`unless` <bool> `then` Block `;`
```
Conditional statements are similar to [conditional expressions](./expressions-operators.md#conditional).
Given a boolean condition, exactly one of two branches will execute.
The difference is that the branches are blocks rather than expressions.
```cpl
val n: int = 42;

if n < 0 then {
	print.("n is negative");
} else {
	print.("n is non-negative");
};
```
The block following `then` is sometimes called the “`then` branch” or the **consequent**.
The block following `else` is sometimes called the “`else` branch” or the **alternative**.

Unlike conditional *expressions*, the `else` branch of a conditional statement may be omitted.
If the condition fails, then nothing happens.
```cpl
if n < 0 then {
	print.("n is negative");
};
```

Conditional statements can be nested.
```cpl
if n >= 0 then {
	if n > 0 then {
		print.("n is positive");
	} else {
		print.("n is zero");
	};
} else {
	print.("n is negative");
};

if n < 0 then {
	print.("n is negative");
} else {
	if n > 0 then {
		print.("n is positive");
	} else {
		print.("n is zero");
	};
};
```
When the `else` branch of an `if` statement contains only another `if–else` statement, the statements can be flattened together.
```cpl
if n < 0 then {
	print.("n is negative");
} else if n > 0 then {
	print.("n is positive");
} else {
	print.("n is zero");
};
```
This can be done for arbitrarily large `if–else` chains.

The keyword `unless` simply negates the condition. It executes the consequent if the condition fails.
```cpl
unless n == 1 then {
	print.("n is not 1");
};
```
For `unless` statements, including an `else` branch is a syntax error. Just make it an `if` and switch the branches.
```diff
-unless n < 0 then {
-	print.("n is not negative");
-} else {
-	print.("n is negative");
-};
+if n < 0 then {
+	print.("n is negative");
+} else {
+	print.("n is not negative");
+};
```



## Loops
`while–do` loops (or just “`while` loops”) and `do–while` loops repeat execution of a block of code as long as a given condition holds.
The condition is re-evaluated on every repetition. `while–do` loops are “top-tested”, and `do–while` loops are “bottom-tested”.

```cpl
val mut unread_messages: int = 5;
while unread_messages > 0 do {
	print.("""You have {{ unread_messages }} unread messages…""");
	set unread_messages -= 1;
};
print.("All caught up!");
```
This loop first tests whether `unread_messages > 0`, and if it passes, executes the code block, and then returns control back to the condition.
It then re-evaluates the condition, re-executes the block if passing, and repeats *ad infinitum* until the condition fails (*if* it fails).

A `do–while` loop inverts the order. First it executes the block, then tests the condition, and then repeats.
```cpl
val mut unread_messages: int = 5;
do {
	print.("""You have {{ unread_messages }} unread messages …""");
	set unread_messages -= 1;
} while unread_messages > 0;
print.("All caught up!");
```
The difference is that a `do–while` loop is guaranteed to execute at least once, whereas a `while–do` loop might not ever execute.

The keyword `until` simply negates the condition. It executes the block if the condition fails.
```cpl
val mut progress: float = 0.0;
until progress >= 1.0 do {
	print.("""Download at {{ progress * 100.0 }}% …""");
	set progress += 0.02718281828;
};
do {
	print.("""Download at {{ progress * 100.0 }}% …""");
	set progress += 0.02718281828;
} until progress >= 1.0;
print.("Download complete!");
```


### Break Statements
Inside a `while` or `until` loop, a `break;` statement directs control flow to stop execution mid-loop, and then exit the loop completely.
```cpl
val mut i: int = 0;
while i < 10 do {
	if i == 3 then {
		break;
	};
	print.(i);
	set i += 1;
}; % only prints 0, 1, and 2, then stops
```
A `skip;` statement stops the current repetition, but then proceeds to the next one.
```cpl
val mut i: int = 0;
while i < 10 do {
	if i == 3 then {
		print.("skipped");
		set i = 4;
		skip;
	};
	print.(i);
	set i += 1;
}; % prints 0, 1, 2, "skipped", 4, 5, 6, 7, 8, and 9
```
`skip;` behaves the same in `while–do` and `do–while` loops:
In both cases, control skips to the end of the loop body and re-evaluates the condition before starting the next repetition.
```cpl
val mut i: int = 0;
while i < 10 do {
	if i == 3 then {
		print.("skipped");
		set i = 20;
		skip;
	};
	print.(i);
	set i += 1;
}; % prints 0, 1, 2, "skipped"

set i = 0;
do {
	if i == 3 then {
		print.("skipped");
		set i = 20;
		skip;
	};
	print.(i);
	set i += 1;
} while i < 10; % prints 0, 1, 2, "skipped"
```



## Iteration
`for` loops iterate over dynamically indexed data types, such as lists and generators.
It declares a variable, the **iteration variable**, which is assigned to items of the **iterable**,
and which can be referenced in the loop body.
For each iteration of the loop, the iteration variable is reassigned to each of the iterable’s items, one by one.
The loop ends when the list has been exhausted.
```cpl
for n: int in [10, 20, 30] do {
	print.(n + 5);
}; % prints 15, 25, 35
```
The iteration variable must be typed to match the iterable’s item types.
Though it’s implicitly reassigned to a new item on each iteration, it can’t be explicitly reassigned by the programmer.
```cpl
for n: int in [10, 20, 30] {
	set n += 10; %> AssignmentError: Reassignment of a read-only variable: `n`.
};
```

The iterable doesn’t need to be a list literal; it can be any expression, such as a function call or a variable reference.
The iterable is *only evaluated once*, before the loop begins, and that same iterable value is used for the entire loop.
This means that if the iterable is ever *mutated* by the loop, that mutation will affect the loop!
```cpl
val list_of_tens: mut [int] = [10, 20, 30];
for n: int in list_of_tens do {
	print.(n);
	if n == 20 then {
		list_of_tens.drop.(); % drops the 30 from the list
		list_of_tens == [10, 20]; %== true
	};
}; % only prints 10, 20
```
Even though it looks like the loop should have run three times,
the iterable’s mutation, dropping the last element, caused it to end ahead of schedule.
As a general rule, it’s best not to mutate lists while iterating over them.

Break statements (`break;` and `skip;`) may be used in `for` loops as well.
They can be useful when we need to short-circuit a loop, for example if we have what we need before the iterable is exhausted.
Here’s a simple implementation of `List#find` using `break;`.
```cpl
% Find just one person with no middle name. There may be more, but we only need one.
val mut found?: Person;
for person: Person in list do {
	if ?person.middleName then {
		set found = person;
		break; % stops iteration here, skips the rest of the list
	};
};
```
In a `for` loop, `skip;` works the same as it does in `while`/`until` loops,
stopping the current iteration and sending control back to the top of the loop.
The iteration variable is still incremented.
```cpl
for person: Person in list do {
	if ?person.middleName then {
		skip; % stops iteration here, proceeds to the next item
	};
	print.(person.middleName);
};
```
