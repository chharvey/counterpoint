# Solid Language: Expressions
This chapter defines the syntax, semantics, and behavior of expressions in the Solid programming language.


### Abstract Operation: PerformNumericBinaryOperation
```
RealNumber PerformNumericBinaryOperation(Text op, RealNumber operand0, RealNumber operand1) :=
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


### AbstractOperation: AssessSemanticOperationBinary
```
Or<Integer, Float>? AssessSemanticOperationBinary(SemanticOperation expr) :=
	1. *Assert:* `expr.children.count` is 2.
	2. *Let* `operand0` be the result of performing `Assess(expr.children.0)`.
	3. *If* `TypeOf(operand0)` is `Void`:
		1. *Return*.
	4. *Let* `operand1` be the result of performing `Assess(expr.children.1)`.
	5. *If* `TypeOf(operand1)` is `Void`:
		1. *Return*.
	6. *If* `TypeOf(operand0)` is `Integer` *and* `TypeOf(operand1)` is `Integer`:
		1. *Return:* `Integer(PerformNumericBinaryOperation(expr.operator, operand0, operand1))`.
	7. *Assert*: `IsNumeric(operand0)` *and* `IsNumeric(operand1)`.
	8. *Return:* `Float(PerformNumericBinaryOperation(expr.operator, Float(float0), Float(float1)))`.
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


### Runtime Instructions: Evaluate (Literals)
```
Void Evaluate(Instruction :::= "Push `value` onto the operand stack.", Or<Integer, Float> value) :=
	1. Push `value` onto the operand stack.
```



## Expression Units


### Runtime Instructions: Evaluate (Expression Units)
```
Void Evaluate(SemanticIdentifier iden) :=
	/* TO BE DETERMINED */
```



## Unary Operators


### Runtime Instructions: Evaluate (Unary Operators)
```
Void Evaluate(Instruction :::= "NOT") :=
	1. Pop `operand` from the operand stack.
	2. *If* `TypeOf(operand)` is `Integer` *and* `operand` is `0`:
		1. Push `1` onto the operand stack.
	3. Push `0` onto the operand stack.
Void Evaluate(Instruction :::= "EMPTY") :=
	1. Pop `operand` from the operand stack.
	2. *If* `TypeOf(operand)` is `Integer` *and* `operand` is `0`:
		1. Push `1` onto the operand stack.
	3. *If* `TypeOf(operand)` is `Float` *and* `operand` is `0.0` or `-0.0`:
		1. Push `1` onto the operand stack.
	4. Push `0` onto the operand stack.
Void Evaluate(Instruction :::= "NEG") :=
	1. Pop `operand` from the operand stack.
	2. *Let* `negation` be the additive inverse, `-operand`,
		obtained by negating `operand`.
	3. Push `negation` onto the operand stack.
```



## Exponentiation


### Runtime Instructions: Evaluate (Exponentiation)
```
Void Evaluate(Instruction :::= "EXP") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `power` be the result of performing `PerformNumericBinaryOperation(EXP, operand0, operand1)`.
	4. Push `power` onto the operand stack.
```



## Multiplicative


### Runtime Instructions: Evaluate (Multiplicative)
```
Void Evaluate(Instruction :::= "MUL") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `product` be the result of performing `PerformNumericBinaryOperation(MUL, operand0, operand1)`.
	4. Push `product` onto the operand stack.
Void Evaluate(Instruction :::= "DIV") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `quotient` be the result of performing `PerformNumericBinaryOperation(DIV, operand0, operand1)`.
	4. Push `quotient` onto the operand stack.
```



## Additive


### Runtime Instructions: Evaluate (Additive)
```
Void Evaluate(Instruction :::= "ADD") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `sum` be the result of performing `PerformNumericBinaryOperation(ADD, operand0, operand1)`.
	4. Push `sum` onto the operand stack.
```



## Conjunctive



## Disjunctive



## Conditional


### Runtime Instructions: Evaluate (Conditional)
```
Void Evaluate(Instruction :::= "IF") :=
	1. Pop `condition` from the operand stack.
	2. *If* `condition` is non-zero:
		1. *Let* `consequent` be the result of performing the next instructions until an "ELSE" instruction is reached.
		2. Push `consequent` onto the operand stack.
	3. *Else:*
		1. *Let* `alternative` be the result of performing the instructions from the next "ELSE" and until an "END" instruction is reached.
		2. Push `alternative` onto the operand stack.
```
