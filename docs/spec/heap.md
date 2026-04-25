# The Heap
This chapter describes the **runtime heap**, a virtual machine memory structure
that stores data encoding [reference objects](./intrinsics.md#reference-objects)
(and sometimes [data values](./intrinsics.md#data-values))
during the execution time of a program.

The heap is a block of memory consisting of bytes of data.
For the purposes of this specification, we can consider the memory layout to be a contiguous array of bytes.
Bytes are indexed by 64-bit unsigned integers, ranging from *0* to
*2<sup>64</sup> - 1 = FFFF,FFFF,FFFF,FFFF<sub>16</sub> = 18,446,744,073,709,551,615 (≈ 16Ei)*.
Only entire bytes may be manipulated; it’s not possible to index or edit an individual bit.
In this chapter, bytes are represented by the notation `\x‹nn›`,
where `‹nn›` is a hexadecimal integer from `00` to `ff`.

Every object is encoded as a sequence of bytes in the heap.
Objects must use a total number of bytes equaling a multiple of 8,
so that all object addresses are of the form *8n* for a natural number *n*.
Additional bytes are added to the object’s encoding as necessary to ensure it uses a whole multiple of 8 bytes.

The first 8 bytes of an object’s encoding, called the **header**, contains the metadata of the object:
its reference counter (`refcount`), the type of the object (`objtype`), and optionally the number of bytes (`bytecount`) in the object’s payload.

Counterpoint uses the **reference counting** technique of memory management.
Each object in the heap keeps track of the number of references pointing to it.
The `refcount` field is allocated 2 bytes, so each object has a maximum of *2<sup>16</sup> - 1 = FFFF<sub>16</sub> = 65,535 (≈ 64Ki)* references.
When an object is created, its `refcount` starts at *1*,
and is incremented and decremented as more references to the object are created and go out of scope, respectively.
Once `refcount` reaches *0*, it is never incremented again, and the object’s memory may be freed.

The `objtype` field is a single byte that indicates the type of the object being stored.
Object types are covered in the following subsection.

Following the `objtype` byte is 1 byte reserved for future use.

Bytes 4–7 of the header contains the object’s `bytecount`: i32 data representing the number of bytes in the object’s payload (if it exists).
It has a maximum value of *2<sup>32</sup> - 1 = FFFF,FFFF<sub>16</sub> = 4,294,967,295 (≈ 4Gi)*.
This is the limit for any object’s payload size.

Following the header is the optional `body`, which contains the object’s payload,
along with any metadata and padding as necessary (in reverse order).
[Type 0](#type-0-special) objects do not have a `body`, since all of their information is contained in the header.
As stated above, the `body` must be a multiple of 8 bytes long,
therefore, if an object’s payload does not meet that requirement, then sufficient padding is prepended to the payload.
All bytes of padding are zero-valued.
No `body` contains more than 7 bytes of padding; that is, the total `body` length
is the least multiple of 8 greater than or equal to the actual number of bytes in the payload.
An object can have no padding (0 bytes) if its `body` length is already a multiple of 8 bytes.

Below are some equivalent formulae computing the number of padding bytes needed for a given `payload_length`.
```cpl
func padding1(payload_length: int): int => mod.(8 - mod.(payload_length, 8), 8);
func padding2(payload_length: int): int => 8 * ceiling.(float payload_length / 8.0) - payload_length;
func padding3(payload_length: int): int => 8 * (payload_length / 8 + 1) - payload_length;
```

The layout of each object encoding in the heap is as follows:

Byte Number | Field       | Required? | Size        | Purpose
----------- | ----------- | --------- | ----------- | -------
0–1         | `refcount`  | yes       | 2 bytes     | Tracks the number of references to the object.
2           | `objtype`   | yes       | 1 byte      | Encodes the type (array, string, etc.) — see [Object Types](#object-types) below.
3           | reserved    | yes       | 1 byte      | Reserved for future use.
4-7         | `bytecount` | yes       | 4 bytes     | Number of bytes in the payload.
8+          | `body`      | no        | 8*n* bytes  | The object’s encoded payload, any Type-specific metadata, and any padding (in reverse order).



## Object Types
There are 8 types. The table below summarizes each type and links to a subsection with further details.
Each subsection also contains a validation scheme indicating whether an object’s payload is valid.
The validation schemes are notated by an [attribute grammar](./notation.md#attribute-grammars).
All validation productions for a given type should be mutually exclusive and collectively exhausted;
if not, the validation productions must be interpreted in order of precedence.

| `objtype` Byte | Type   | Name                                         | Length   | Mutable? | Payload Data                                     |
| -------------- | ------ | -------------------------------------------- | -------- | -------- | ------------------------------------------------ |
| `\x0{0-3}`     | Type 0 | [Special](#type-0-special)                   | fixed    | no       | none                                             |
| `\x1{2,4,8}`   | Type 1 | [Signed Integer](#type-1-signed-integer)     | fixed    | no       | 2 bytes of i16 / 4 bytes of i32 / 8 bytes of i64 |
| `\x2{2,4,8}`   | Type 2 | [Unsigned Integer](#type-2-unsigned-integer) | fixed    | no       | 2 bytes of i16 / 4 bytes of i32 / 8 bytes of i64 |
| `\x3{2,4,8}`   | Type 3 | [Decimal](#type-3-decimal)                   | fixed    | no       | 2 bytes of i16 / 4 bytes of i32 / 8 bytes of i64 |
| `\x4{2,4,8}`   | Type 4 | [Float](#type-4-float)                       | fixed    | no       | 2 bytes of f16 / 4 bytes of f32 / 8 bytes of f64 |
| `\x58`         | Type 5 | [Address](#type-3-address)                   | fixed    | yes      | 8 bytes of i64                                   |
| `\x60`         | Type 6 | [String](#type-4-string)                     | variable | no       | UTF-8 string encoding                            |
| `\x70`         | Type 7 | [Binary](#type-5-binary)                     | variable | yes      | any sequence of bytes                            |
| `\x80`         | Type 8 | [Struct](#type-6-struct)                     | variable | yes      | sequence of objects                              |
| `\x90`         | Type 9 | [Array](#type-7-array)                       | variable | yes      | 1 byte of i8 metadata; then array data           |


### Type 0: Special
Type 0 is reserved for special constant values encoded in memory.
There exists no `body` for this type.
The following table describes special bytes and their values.
Unlisted bytes are reserved for future use.

| `objtype` Byte | Value             |
| -------------- | ----------------- |
| `\x00`         | default           |
| `\x01`         | the `null` value  |
| `\x02`         | the `false` value |
| `\x03`         | the `true` value  |

The byte `\x00` is the initial value of each byte and may be used as a filler for sparse [arrays](#type-7-array).
Bytes `\x04`–`\x0f` are reserved for future special values.

For example, the `true` value is encoded as such:
```
\xff \xff \x03 \x00 \x00 \x00 \x00 \x00
|         |    |    |- 4–7: `bytecount`
|         |    |- 3: reserved
|         |- 2: `objtype`
|- 0–1: `refcount`
```
(We’re only using `\xff \xff` as the `refcount` as an example.)

#### Type 0 Validation
```
Validate(Empty ::= ␃) -> true;

Validate(Type0 ::= ‹refcount› [\x00-\x03] ‹reserved› R* ␃) -> Validate(R* ␃);
Validate(Type0 ::= ‹refcount› [\x04-\x0f] ‹reserved› R* ␃) -> false;
```


### Type 1: Signed Integer
Type 1 is signed integer data, representing a general numerical value.
An `objtype` of `\x12` represents a 16-bit integer and has a payload of 2 bytes of data.
The data is uninterpreted in that it may be signed or unsigned, as needed by an application.
Similarly, `\x14` and `\x18` types represent 32-bit and 64-bit integers, having a payload of 4 and 8 bytes of data respectively.
Padding is prepended to the `body` as necessary to increase it to a multiple of 8.

For example, a 16-bit signed integer with a value of *6* is encoded as such:
```
\xff \xff \x12 \x00 \x00 \x00 \x00 \x02 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x06
|         |    |    |                   |                             |- 14–15: object data (2 bytes of i16)
|         |    |    |                   |- 8–13: padding (6 bytes needed)
|         |    |    |- 4–7: `bytecount`
|         |    |- 3: reserved
|         |- 2: `objtype`
|- 0–1: `refcount`
```

For comparison, here is the same value encoded as a 32-bit signed integer:
```
\xff \xff \x14 \x00 \x00 \x00 \x00 \x04 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x06
|         |    |    |                   |                   |- 12–15: object data (4 bytes of i32)
|         |    |    |                   |- 8–11: padding (4 bytes needed)
|         |    |    |- 4–7: `bytecount`
|         |    |- 3: reserved
|         |- 2: `objtype`
|- 0–1: `refcount`
```

#### Type 1 Validation
```
Validate(Type1 ::= ‹refcount› \x18                              ‹reserved› \x00 \x00 \x00 \x08             P{8}    R* ␃) -> Validate(R* ␃);
Validate(Type1 ::= ‹refcount› \x18                              ‹reserved› \x00 \x00 \x00 \x08 \x00{0, 7}  P{0, 7} R* ␃) -> false;
Validate(Type1 ::= ‹refcount› \x14                              ‹reserved› \x00 \x00 \x00 \x04 \x00{0, 3}  P{5, 8} R* ␃) -> false;
Validate(Type1 ::= ‹refcount› \x14                              ‹reserved› \x00 \x00 \x00 \x04 \x00{4}     P{4}    R* ␃) -> Validate(R* ␃);
Validate(Type1 ::= ‹refcount› \x14                              ‹reserved› \x00 \x00 \x00 \x04 \x00{5, 7}? P{0, 3} R* ␃) -> false;
Validate(Type1 ::= ‹refcount› \x12                              ‹reserved› \x00 \x00 \x00 \x02 \x00{0, 5}  P{3, 8} R* ␃) -> false;
Validate(Type1 ::= ‹refcount› \x12                              ‹reserved› \x00 \x00 \x00 \x02 \x00{6}     P P     R* ␃) -> Validate(R* ␃);
Validate(Type1 ::= ‹refcount› \x12                              ‹reserved› \x00 \x00 \x00 \x02 \x00{7}?    P?      R* ␃) -> false;
Validate(Type1 ::= ‹refcount› [\x10-\x11\x13\x15-\x17\x19-\x1f] ‹reserved›                                         R* ␃) -> false;
```


### Type 2: Unsigned Integer
Type 2 is specified exactly the same as Type 1, except that the header byte is `\x22`, `\x24`, or `\x28`,
and the data is meant to be interpreted as unsigned two’s complement.


### Type 3: Decimal
Type 3, `\x30`–`\x3f`, is reserved.


### Type 4: Float
Type 4 encodes floating-point numbers in the an *IEEE 754-2019* standard format.
An `objtype` of `\x42` represents a 16-bit float and has a payload of 2 bytes of data.
`\x44` and `\x48` types represent 32-bit and 64-bit floats, having a payload of 4 and 8 bytes of data respectively.
Padding is prepended to the `body` as necessary to increase it to a multiple of 8.

#### Type 4 Validation
```
Validate(Type4 ::= ‹refcount› \x48                              ‹reserved› \x00 \x00 \x00 \x08             P{8}    R* ␃) -> Validate(R* ␃);
Validate(Type4 ::= ‹refcount› \x48                              ‹reserved› \x00 \x00 \x00 \x08 \x00{0, 7}  P{0, 7} R* ␃) -> false;
Validate(Type4 ::= ‹refcount› \x44                              ‹reserved› \x00 \x00 \x00 \x04 \x00{0, 3}  P{5, 8} R* ␃) -> false;
Validate(Type4 ::= ‹refcount› \x44                              ‹reserved› \x00 \x00 \x00 \x04 \x00{4}     P{4}    R* ␃) -> Validate(R* ␃);
Validate(Type4 ::= ‹refcount› \x44                              ‹reserved› \x00 \x00 \x00 \x04 \x00{5, 7}? P{0, 3} R* ␃) -> false;
Validate(Type4 ::= ‹refcount› \x42                              ‹reserved› \x00 \x00 \x00 \x02 \x00{0, 5}  P{3, 8} R* ␃) -> false;
Validate(Type4 ::= ‹refcount› \x42                              ‹reserved› \x00 \x00 \x00 \x02 \x00{6}     P P     R* ␃) -> Validate(R* ␃);
Validate(Type4 ::= ‹refcount› \x42                              ‹reserved› \x00 \x00 \x00 \x02 \x00{7}?    P?      R* ␃) -> false;
Validate(Type4 ::= ‹refcount› [\x40-\x41\x43\x45-\x47\x49-\x4f] ‹reserved›                                         R* ␃) -> false;
```


### Type 5: Address
Type 5 represents an address as an “offset”. It has an `objtype` of `\x58`.
The address points to a location in memory of the referenced object; its value is the index of the byte in memory where the object starts.
This address may be set to a new value if the referenced object is moved in the heap. (Addresses are mutable.)
The payload is 8 bytes of 64-bit unsigned integer data, without any padding.

#### Type 5 Validation
```
Validate(Type5 ::= ‹refcount› \x58                 ‹reserved› \x00 \x00 \x00 \x08            P{8}    R* ␃) -> Validate(R* ␃);
Validate(Type5 ::= ‹refcount› \x58                 ‹reserved› \x00 \x00 \x00 \x08 \x00{0, 7} P{0, 7} R* ␃) -> false;
Validate(Type5 ::= ‹refcount› [\x50-\x57\x59-\x5f] ‹reserved›                                        R* ␃) -> false;
```


### Type 6: String
Type 6 is textual data (a “string” of characters) encoded in [UTF-8 format](https://en.wikipedia.org/wiki/UTF-8).
It has an `objtype` of `\x60`. Padding is prepended to the `body` as necessary to increase it to a multiple of 8.

Note that string length may differ from its **count** — the number of code points in the string —
because some code points are encoded as multiple bytes in UTF-8.
String data must not be mutated.
If a change in data is desired, the string data should instead be deallocated and then reallocated to a new string.

For example, the string `"hello"` is encoded as such:
```
\xff \xff \x60 \x00 \x00 \x00 \x00 \x05 \x00 \x00 \x00 \x68 \x65 \x6c \x6c \x6f
|         |    |    |                   |              |- 11–15: object data (5 bytes of UTF-8)
|         |    |    |                   |- 8–10: padding (3 bytes needed)
|         |    |    |- 4–7: `bytecount`
|         |    |- 3: reserved
|         |- 2: `objtype`
|- 0–1: `refcount`
```

#### Type 6 Validation
```
Validate(Type4 ::=‹refcount› \x60        ‹reserved› C{4}    \x00{0, 7} P{numeric(C{4})}        R* ␃) -> UTF8Validate(P{numeric(C{4})}) && Validate(R* ␃);
Validate(Type4 ::=‹refcount› \x60        ‹reserved› C{4}    \x00{0, 7} P{0, numeric(C{4}) - 1} R* ␃) -> false;
Validate(Type4 ::=‹refcount› \x60        ‹reserved› C{0, 3}                                    R* ␃) -> false;
Validate(Type4 ::=‹refcount› [\x61-\x6f] ‹reserved›                                            R* ␃) -> false;
```


### Type 7: Binary
Type 7 type stores arbitrary unstructured binary data.
It is similar in format to Type 6, except that the payload need not be valid in UTF-8.
Binary data may be mutated.

#### Type 7 Validation
```
Validate(Type7 ::= ‹refcount› \x70        ‹reserved› C{4}    \x00{0, 7} P{numeric(C{4})}        R* ␃) -> Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x70        ‹reserved› C{4}    \x00{0, 7} P{0, numeric(C{4}) - 1} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x70        ‹reserved› C{0, 3}                                    R* ␃) -> false;
Validate(Type7 ::= ‹refcount› [\x71-\x7f] ‹reserved›                                            R* ␃) -> false;
```


### Type 8: Struct
Type 8 (`objtype` `\x80`) represents structs (“structures”), which have a length and a (possibly) heterogeneous mix of items.
Struct data may be used to encode Counterpoint [Tuple objects](./types-values.md#tuple-types),
[Record objects](./types-values.md#record-types), and instances of [classes] (link pending),
all of which have statically fixed indices or keys.

The struct’s length is the number of bytes needed for all its items, stored in the `bytecount` field.
As with Type 6, this may differ from the struct’s **count**.
Struct slots may be mutable, but their length is not. The slots in a struct may be filled and unfilled as needed,
as long as the struct’s length and count do not change, and as long as its items’ types do not change.
If changes to this metadata are desired, the struct must instead be deallocated and then reallocated to a new struct.

Structs may only contain objects of Type 0–5. For other types, references (addresses, see Type 5) must be used instead.

Because structs may be heterogeneous, each item must be encoded in its own right, able to be read out of context.
For indexing to be possible, the type and length of each item must be taken into account.
Therefore, each object in the struct contains its own `objtype` byte, followed by its un-padded payload (if it exists).
(The entire struct’s `body` will be padded as necessary to increase its length to a multiple of 8.)
Since only Types 0–3 are valid in a struct, the length of any struct item is given by its type as indicated in its own `objtype` byte.

For example, a struct of three items: the boolean *true*, the signed 16-bit integer *6*, and the address *304*; is encoded by the following:
```
\xff \xff \x80 \x00 \x00 \x00 \x00 \x0d \x00 \x00 \x00 \x03 \x12 \x00 \x06 \x38 \x00 \x00 \x00 \x00 \x00 \x00 \x01 \x30
|         |    |    |                   |              |- 11–23: objects’ data (including `objtype`s)
|         |    |    |                   |- 8–10: padding (3 bytes needed)
|         |    |    |- 4–7: `bytecount`
|         |    |- 3: reserved
|         |- 2: `objtype`
|- 0–1: `refcount`
```

It is also possible to have an empty struct:
```
\xff \xff \x80 \x00 \x00 \x00 \x00 \x00
|         |    |    |- 4–7: `bytecount`
|         |    |- 3: reserved
|         |- 2: `objtype`
|- 0–1: `refcount`
```

When structs refer to Types 6–9 objects, those objects must be stored separately in the heap, and their addresses are then held in the struct.
Here’s a struct containing two strings: `"hello"` and `"world"` (line breaks added for readability).
Notice that because objects are always offset by a multiple of 8, each address’s value is a multiple of 8.
```
\xff \xff \x80 \x00 \x00 \x00 \x00 \x12 \x00 \x00 \x00 \x00 \x00 \x00 \x58 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x20 \x58 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x30
|         |    |    |                   |                             |- 14–31: payload (18 bytes): addresses 32 and 48
|         |    |    |                   |- 8–13: padding (6 bytes needed)
|         |    |    |- 4–7: `bytecount`
|         |    |- 3: reserved
|         |- 2: `objtype`
|- 0–1: `refcount` for struct

(continued)
\x00 \x01 \x60 \x00 \x00 \x00 \x00 \x05 \x00 \x00 \x00 \x68 \x65 \x6c \x6c \x6f
|         |    |    |                   |              |- 43–47: object data (5 bytes of UTF-8)
|         |    |    |                   |- 40–42: padding (3 bytes needed)
|         |    |    |- 36–39: `bytecount`
|         |    |- 35: reserved
|         |- 34: `objtype`
|- 32–33: `refcount` for string "hello"

(continued)
\x00 \x01 \x60 \x00 \x00 \x00 \x00 \x05 \x00 \x00 \x00 \x77 \x6f \x72 \x6c \x64
|         |    |    |                   |              |- 59–63: object data (5 bytes of UTF-8)
|         |    |    |                   |- 56–58: padding (3 bytes needed)
|         |    |    |- 52–55: `bytecount`
|         |    |- 51: reserved
|         |- 50: `objtype`
|- 48–49: `refcount` for string "world"
```

A struct can even hold nested structs. The following encodes the Counterpoint Tuple `[ [],  [[]],  [[], [[]]] ]` (line breaks added for readability).
Notice that just because Tuples are “equivalent” doesn’t mean they share the same reference.
For example, the Tuple `[]` appears four times here, but it must be encoded separately each time.
```
\xff \xff \x80 \x00 \x00 \x00 \x00 \x1b \x00 \x00 \x00 \x00 \x00 \x58 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x28 \x58 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x30 \x58 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x50
|         |    |    |                   |                        |- 13–39: payload (27 bytes): addresses 40, 48, and 80
|         |    |    |                   |- 8–12: padding (5 bytes needed)
|         |    |    |- 4–7: `bytecount`
|         |    |- 3: reserved
|         |- 2: `objtype`
|- 0–1: `refcount` for outer struct

(continued)
\x00 \x01 \x80 \x00 \x00 \x00 \x00 \x00
|         |    |    |- 44–47: `bytecount`
|         |    |- 43: reserved
|         |- 42: `objtype`
|- 40–41: `refcount` for 1st inner struct

(continued)
\x00 \x01 \x80 \x00 \x00 \x00 \x00 \x09 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x58 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x48     \x00 \x01 \x80 \x00 \x00 \x00 \x00 \x00
|         |    |    |                   |                                  |- 63–71: payload (9 bytes): address 72          |         |    |    |- 76–79: `bytecount`
|         |    |    |                   |- 56–62: padding (7 bytes needed)                                                  |         |    |- 75: reserved
|         |    |    |- 52–55: `bytecount`                                                                                   |         |- 74: `objtype`
|         |    |- 51: reserved                                                                                              |- 72–73: `refcount`
|         |- 50: `objtype`
|- 48–49: `refcount` for 2nd inner struct

(continued)
\x00 \x01 \x80 \x00 \x00 \x00 \x00 \x12 \x00 \x00 \x00 \x00 \x00 \x00 \x58 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x70 \x58 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x78     \x00 \x01 \x80 \x00 \x00 \x00 \x00 \x00     \x00 \x01 \x80 \x00 \x00 \x00 \x00 \x09 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x58 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x90     \x00 \x01 \x80 \x00 \x00 \x00 \x00 \x00
|         |    |    |                   |                             |- 94–111: payload (18 bytes): addresses 112 and 120                                          |         |    |    |- 116–119: `bytecount` |         |    |    |                   |                                  |- 135–143: payload (9 bytes): address 144       |         |    |    |- 148–151: `bytecount`
|         |    |    |                   |- 88–93: padding (6 bytes needed)                                                                                          |         |    |- 115: reserved             |         |    |    |                   |- 128–134: padding (7 bytes needed)                                                |         |    |- 147: reserved
|         |    |    |- 84–87: `bytecount`                                                                                                                           |         |- 114: `objtype`                 |         |    |    |- 124–127: `bytecount`                                                                                 |         |- 146: `objtype`
|         |    |- 83: reserved                                                                                                                                      |- 112–113: `refcount`                      |         |    |- 123: reserved                                                                                             |- 144–145: `refcount`
|         |- 82: `objtype`                                                                                                                                                                                      |         |- 122: `objtype`
|- 80–81: `refcount` for 3rd inner struct                                                                                                                                                                       |- 120–121: `refcount`
```

#### Type 8 Validation
```
Validate(Type8 ::= ‹refcount› \x80        ‹reserved› C{4}    \x00{0, 7} P{numeric(C{4})}        R* ␃) -> StructValidate(P{numeric(C{4})}) && Validate(R* ␃);
Validate(Type8 ::= ‹refcount› \x80        ‹reserved› C{4}    \x00{0, 7} P{0, numeric(C{4}) - 1} R* ␃) -> false;
Validate(Type8 ::= ‹refcount› \x80        ‹reserved› C{0, 3}                                    R* ␃) -> false;
Validate(Type8 ::= ‹refcount› [\x81-\x8f] ‹reserved›                                            R* ␃) -> false;

StructValidate(StructPayload ::= [\x00-\x03]                               R*) -> StructValidate(R*);
StructValidate(StructPayload ::= [\x04-\x0f]                               R*) -> false;
StructValidate(StructPayload ::= \x18                              P{8}    R*) -> StructValidate(R*);
StructValidate(StructPayload ::= \x18                              P{0, 7} R*) -> false;
StructValidate(StructPayload ::= \x14                              P{5, 8} R*) -> false;
StructValidate(StructPayload ::= \x14                              P{4}    R*) -> StructValidate(R*);
StructValidate(StructPayload ::= \x14                              P{0, 3} R*) -> false;
StructValidate(StructPayload ::= \x12                              P{3, 8} R*) -> false;
StructValidate(StructPayload ::= \x12                              P P     R*) -> StructValidate(R*);
StructValidate(StructPayload ::= \x12                              P?      R*) -> false;
StructValidate(StructPayload ::= [\x10-\x11\x13\x15-\x17\x19-\x1f]         R*) -> false;
StructValidate(StructPayload ::= \x28                              P{8}    R*) -> StructValidate(R*);
StructValidate(StructPayload ::= \x28                              P{0, 7} R*) -> false;
StructValidate(StructPayload ::= \x24                              P{5, 8} R*) -> false;
StructValidate(StructPayload ::= \x24                              P{4}    R*) -> StructValidate(R*);
StructValidate(StructPayload ::= \x24                              P{0, 3} R*) -> false;
StructValidate(StructPayload ::= \x22                              P{3, 8} R*) -> false;
StructValidate(StructPayload ::= \x22                              P P     R*) -> StructValidate(R*);
StructValidate(StructPayload ::= \x22                              P?      R*) -> false;
StructValidate(StructPayload ::= [\x20-\x21\x23\x25-\x27\x29-\x2f]         R*) -> false;
StructValidate(StructPayload ::= \x38                              P{8}    R*) -> StructValidate(R*);
StructValidate(StructPayload ::= \x38                              P{0, 7} R*) -> false;
StructValidate(StructPayload ::= \x34                              P{5, 8} R*) -> false;
StructValidate(StructPayload ::= \x34                              P{4}    R*) -> StructValidate(R*);
StructValidate(StructPayload ::= \x34                              P{0, 3} R*) -> false;
StructValidate(StructPayload ::= \x32                              P{3, 8} R*) -> false;
StructValidate(StructPayload ::= \x32                              P P     R*) -> StructValidate(R*);
StructValidate(StructPayload ::= \x32                              P?      R*) -> false;
StructValidate(StructPayload ::= [\x30-\x31\x33\x35-\x37\x39-\x3f]         R*) -> false;
StructValidate(StructPayload ::= \x48                              P{8}    R*) -> StructValidate(R*);
StructValidate(StructPayload ::= \x48                              P{0, 7} R*) -> false;
StructValidate(StructPayload ::= \x44                              P{5, 8} R*) -> false;
StructValidate(StructPayload ::= \x44                              P{4}    R*) -> StructValidate(R*);
StructValidate(StructPayload ::= \x44                              P{0, 3} R*) -> false;
StructValidate(StructPayload ::= \x42                              P{3, 8} R*) -> false;
StructValidate(StructPayload ::= \x42                              P P     R*) -> StructValidate(R*);
StructValidate(StructPayload ::= \x42                              P?      R*) -> false;
StructValidate(StructPayload ::= [\x40-\x41\x43\x45-\x47\x49-\x4f]         R*) -> false;
StructValidate(StructPayload ::= \x58                              P{8}    R*) -> StructValidate(R*);
StructValidate(StructPayload ::= \x58                              P{0, 7} R*) -> false;
StructValidate(StructPayload ::= [\x50-\x57\x59-\x5f]                      R*) -> false;
StructValidate(StructPayload ::= [\x60-\xff]                               R*) -> false;
```


### Type 9: Array
Type 9 (`objtype` `\x90`) represents arrays, which have a length and a homogeoneous item type.
Arrays may be used to encode many kinds of dynamic objects, such as
[Lists, Dicts, and Maps](./types-values.md#compound-types), which may have unfixed indices/keys.

The **count** of an array is its number of slots — the number of potential items it may hold.
This is not necessarily the same as the array’s **length**, which is the number of bytes needed,
nor is it the same as the number of items it actually holds at any given time.
For example, an array of count 8 holding five 3-byte items would have a length of 24.
Any unfilled slots are populated with the default byte `\x00`.
This differs from Type 8, which has no empty slots.

An array’s *count* must be a power of 2 determined by the number of items it holds and a specified load factor.
The slots in an array may be filled and unfilled as needed, as long as the array’s type does not change.
However, unlike Type 8 objects, Type 9 objects may change their length —
if more items are to be added, the array must be deallocated and then a new array with a sufficient count must be allocated.
Depending on the array’s location and its neighbors in the heap,
it may need to be moved to a new location in memory in order to accommodate memory size (at which point all its references must be updated).
Likewise, an array must be moved into a new smaller array once it has too many empty slots.

The maximum *count* of any array is theoretically limited to
*2<sup>63</sup> = 8000,0000,0000,0000<sub>16</sub> = 9,223,372,036,854,775,808* (= 8Ei)
(which is the greatest power of 2 that is less than or equal to the maximum Natural Number (unsigned integer) value of
*2<sup>64</sup> - 1 = FFFF,FFFF,FFFF,FFFF<sub>16</sub> = 18,446,744,073,709,551,615* (≈ 16Ei)).
In practice, however, array length cannot exceed the maximum `bytecount` value,
and this limits its maximum count depending on the size of each item.

Arrays may only contain objects of Type 0–5, and they all must be the same type.
For other types, or a heterogeneous mix of types, references (addresses) must be used instead — see Type 5.

Since arrays are homogeneous, there is no need to encode metadata for each item in the array individually as is done in Type 8.
Rather, the metadata takes a single byte encoding the type of all array items at once.
This byte takes the first byte of the array’s payload (after padding) in the same format as an object’s `objtype` field.
There is one exception to this rule:
Since `objtype` differs for all Type 0 items, this metadata byte is `\xff` (so as not to be confused with padding),
and then the items’ data (`\x00`–`\x0f`) follow as normal.

An array of five specials looks like this.
Because the array currently holds 5 items, its count must be 8 (the next power of 2), and those slots are filled with default bytes.
```
\xff \xff \x90 \x00 \x00 \x00 \x00 \x09 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \xff \x01 \x02 \x03 \x02 \x01 \x00 \x00 \x00
|         |    |    |                   |                                  |    |                        |- 21–23: default bytes due to sparseness
|         |    |    |                   |                                  |    |- 16–20: objects’ data (excluding `objtype`s)
|         |    |    |                   |                                  |- 15: items’ type (Type 0, represented by `\xff`)
|         |    |    |                   |- 8–14: padding (7 bytes needed)
|         |    |    |- 4–7: `bytecount`
|         |    |- 3: reserved
|         |- 2: `objtype`
|- 0–1: `refcount`
```

An array of three 16-bit integers, *6*, *306*, *15_306*, is encoded as the following:
```
\xff \xff \x90 \x00 \x00 \x00 \x00 \x09 \x00 \x00 \x00 \x00 \x00 \x00 \x00 \x12 \x00 \x06 \x01 \x32 \x3b \xca \x00 \x00
|         |    |    |                   |                                  |    |                             |- 22–23: default bytes due to sparseness
|         |    |    |                   |                                  |    |- 16–21: objects’ data (excluding `objtype`s)
|         |    |    |                   |                                  |- 15: items’ type (Type 1)
|         |    |    |                   |- 8–14: padding (7 bytes needed)
|         |    |    |- 4–7: `bytecount`
|         |    |- 3: reserved
|         |- 2: `objtype`
|- 0–1: `refcount`
```

#### Type 9 Validation
```
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \xff                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\xff, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \xff                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} [\x01-\x0f]                                               R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x18                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\x18, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x18                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x14                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\x14, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x14                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x12                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\x12, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x12                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} [\x10-\x11\x13\x15-\x17\x19-\x1f]                         R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x28                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\x28, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x28                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x24                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\x24, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x24                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x22                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\x22, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x22                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} [\x20-\x21\x23\x25-\x27\x29-\x2f]                         R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x38                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\x38, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x38                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x34                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\x34, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x34                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x32                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\x32, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x32                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} [\x30-\x31\x33\x35-\x37\x39-\x3f]                         R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x48                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\x48, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x48                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x44                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\x44, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x44                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x42                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\x42, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x42                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} [\x40-\x41\x43\x45-\x47\x49-\x4f]                         R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x58                              P{numeric(C{4}) - 1}    R* ␃) -> ArrayValidate(\x58, P{numeric(C{4}) - 1}) && Validate(R* ␃);
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} \x58                              P{0, numeric(C{4}) - 2} R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} [\x50-\x57\x59-\x5f]                                      R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{4}    \x00{0, 7} [\x60-fe]                                                 R* ␃) -> false;
Validate(Type7 ::= ‹refcount› \x90        ‹reserved› C{0, 3}                                                                      R* ␃) -> false;
Validate(Type7 ::= ‹refcount› [\x91-\x9f] ‹reserved›                                                                              R* ␃) -> false;

ArrayValidate(\xff, ArrayPayload ::= [\x00-\x03] R*) -> ArrayValidate(\xff, R*);
ArrayValidate(\xff, ArrayPayload ::= [\x04-\x0f] R*) -> false;
ArrayValidate(\x18, ArrayPayload ::= P{8}        R*) -> ArrayValidate(\x18, R*);
ArrayValidate(\x18, ArrayPayload ::= P{0, 7}     R*) -> false;
ArrayValidate(\x14, ArrayPayload ::= P{4}        R*) -> ArrayValidate(\x14, R*);
ArrayValidate(\x14, ArrayPayload ::= P{0, 3}     R*) -> false;
ArrayValidate(\x12, ArrayPayload ::= P P         R*) -> ArrayValidate(\x12, R*);
ArrayValidate(\x12, ArrayPayload ::= P?          R*) -> false;
ArrayValidate(\x28, ArrayPayload ::= P{8}        R*) -> ArrayValidate(\x28, R*);
ArrayValidate(\x28, ArrayPayload ::= P{0, 7}     R*) -> false;
ArrayValidate(\x24, ArrayPayload ::= P{4}        R*) -> ArrayValidate(\x24, R*);
ArrayValidate(\x24, ArrayPayload ::= P{0, 3}     R*) -> false;
ArrayValidate(\x22, ArrayPayload ::= P P         R*) -> ArrayValidate(\x22, R*);
ArrayValidate(\x22, ArrayPayload ::= P?          R*) -> false;
ArrayValidate(\x38, ArrayPayload ::= P{8}        R*) -> ArrayValidate(\x38, R*);
ArrayValidate(\x38, ArrayPayload ::= P{0, 7}     R*) -> false;
ArrayValidate(\x34, ArrayPayload ::= P{4}        R*) -> ArrayValidate(\x34, R*);
ArrayValidate(\x34, ArrayPayload ::= P{0, 3}     R*) -> false;
ArrayValidate(\x32, ArrayPayload ::= P P         R*) -> ArrayValidate(\x32, R*);
ArrayValidate(\x32, ArrayPayload ::= P?          R*) -> false;
ArrayValidate(\x48, ArrayPayload ::= P{8}        R*) -> ArrayValidate(\x48, R*);
ArrayValidate(\x48, ArrayPayload ::= P{0, 7}     R*) -> false;
ArrayValidate(\x44, ArrayPayload ::= P{4}        R*) -> ArrayValidate(\x44, R*);
ArrayValidate(\x44, ArrayPayload ::= P{0, 3}     R*) -> false;
ArrayValidate(\x42, ArrayPayload ::= P P         R*) -> ArrayValidate(\x42, R*);
ArrayValidate(\x42, ArrayPayload ::= P?          R*) -> false;
ArrayValidate(\x58, ArrayPayload ::= P{8}        R*) -> ArrayValidate(\x58, R*);
ArrayValidate(\x58, ArrayPayload ::= P{0, 7}     R*) -> false;
```
