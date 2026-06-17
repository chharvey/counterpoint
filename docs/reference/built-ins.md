# Built-Ins



## Numeric Conversions
```
Integer.(<Number>)
Natural.(<Number>)
Float.(<Number>)
```
The class constructors `Integer`, `Natural`, and `Float` can be used as numeric conversion operators.
They convert their numeric operand into their respective type. If the operand is not numeric, a type error is raised.
```cpl
val my_int: int   = 7;
val my_nat: nat   = +4;
val my_flt: float = -3.5;

2 * Integer.(my_flt); % converts -3.5 to -3; result is same as `2 * -3`
Float.(my_int) / 3.5; % converts 7 to 7.0; result is same as `7.0 / 3.5`
2 - Integer.(my_nat); % converts +4 to 4; result is same as `2 - 4`
Natural.(my_flt);     % negative floats are converted to `+0`
```
When converting floats to integers/naturals, the “round-toward-zero” (truncation) method is used.
Both `-0.0` and `0.0` convert to `0`/`+0`.
When converting to integers, if the floating-point number is greater than the maximal integer *2^63 &minus; 1*, the maximal integer is returned;
likewise for less than the minimal integer *&minus;2^63*.
When converting to naturals, if the floating-point number is greater than the maximal natural *2^64 &minus; 1*, the maximal natural is returned;
if the float is negative, the natural number `+0` is returned.
For NaN and other unrepresentable values, an error is raised.

When converting integers/naturals to floats, some precision will be lost for numbers greater than *2^53*
and for numbers less than *&minus;2^53*, as per the *IEEE 754* specification.

Integer conversion to and from natural numbers does not change bitwise representation, just reinterpretation.
Any (signed) integer value between *-(2^63)* and *-1* is just added mathematically to *2^64* to get its (unsigned) natural interpretation
(that is, underflow occurs).
Conversely, natural numbers *2^63* or larger are reinterpreted as negative integers by subtracting *2^64* from their value (overflow occurs).
