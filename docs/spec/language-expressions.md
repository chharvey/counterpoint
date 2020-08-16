# Solid Language: Expressions
This chapter defines the syntax, semantics, and behavior of expressions in the Solid programming language.


### Abstract Operation: PerformBinaryArithmetic
```
Or<Integer, Float> PerformBinaryArithmetic(Text op, Or<Integer, Float> operand0, Or<Integer, Float> operand1) :=
	1. *If* `op` is `EXP`:
		1. *Let* `result` be the power, `operand0 ^ operand1`,
			obtained by raising `operand0` (the base) to `operand1` (the exponent).
		2. *Return:* `result`.
	2. *Else If* `op` is `MUL`:
		1. *Let* `result` be the product, `operand0 * operand1`,
			obtained by multiplying `operand0` (the multiplicand) by `operand1` (the multiplier).
		2. *Return:* `result`.
	3. *Else If* `op` is `DIV`:
		1. *Let* `result` be the quotient, `operand0 / operand1`,
			obtained by dividing `operand0` (the dividend) by `operand1` (the divisor).
		2. *Return:* `result`.
	4. *Else If* `op` is `ADD`:
		1. *Let* `result` be the sum, `operand0 + operand1`,
			obtained by adding `operand0` (the augend) to `operand1` (the addend).
		2. *Return:* `result`.
	5. *Throw:* TypeError "Invalid operation.".
```


### Abstract Operation: TryAssessAndBuild
The abstract operation **TryAssessAndBuild** attempts to assess a semantic node first and then build the assessment;
if the assessment fails, it builds the semantic node.
```
Sequence<Instruction> TryAssessAndBuild(SemanticExpression expr) :=
	1. *Let* `assess` be the result of performing `Assess(expr)`.
	2. *If* `TypeOf(assess)` is `Void`:
		1. *Let* `instrs` be the result of performing `Build(expr)`.
	3. *Else:*
		1. *Let* `instrs` be the result of performing `Build(assess)`.
	4. *Return:* `instrs`.
```


### Abstract Operation: PrebuildSemanticOperationBinary
```
Sequence<Sequence<Instruction>, Sequence<Instruction>> PrebuildSemanticOperationBinary(SemanticOperation expr) :=
	1. *Assert:* `expr.children.count` is 2.
	2. *Let* `instrs0` be the result of performing `TryAssessAndBuild(expr.children.0)`.
	3. *Let* `instrs1` be the result of performing `TryAssessAndBuild(expr.children.1)`.
	4. *Return:* [instrs0, instrs1].
```



## Literals



## Expression Units



## Unary Operators



## Exponentiation



## Multiplicative



## Additive



## Comparative



## Equality



## Conjunctive



## Disjunctive



## Conditional
