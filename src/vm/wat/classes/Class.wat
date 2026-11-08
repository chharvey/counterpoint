(global $Class.CLASS (export "Class#CLASS") (ref $Class) (struct.new $Class
	(i64.const 0x00) ;; `Class` is the very first object — with ID 0
	(ref.null $Class)
	(ref.null $Dict)
))

(global $Class.DATA (export "Class#DATA") (ref $Class) (struct.new $Class
	(i64.const 0x01)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.NULL (export "Class#NULL") (ref $Class) (struct.new $Class
	(i64.const 0x02)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.BOOLEAN (export "Class#BOOLEAN") (ref $Class) (struct.new $Class
	(i64.const 0x03)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.SYMBOL (export "Class#SYMBOL") (ref $Class) (struct.new $Class
	(i64.const 0x04)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.INTEGER (export "Class#INTEGER") (ref $Class) (struct.new $Class
	(i64.const 0x05)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.NATURAL (export "Class#NATURAL") (ref $Class) (struct.new $Class
	(i64.const 0x06)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.FLOAT (export "Class#FLOAT") (ref $Class) (struct.new $Class
	(i64.const 0x07)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.STRING (export "Class#STRING") (ref $Class) (struct.new $Class
	(i64.const 0x08)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))

(global $Class.OBJECT (export "Class#OBJECT") (ref $Class) (struct.new $Class
	(i64.const 0x09)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.LIST (export "Class#LIST") (ref $Class) (struct.new $Class
	(i64.const 0x0a)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.DICT (export "Class#DICT") (ref $Class) (struct.new $Class
	(i64.const 0x0b)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.SET (export "Class#SET") (ref $Class) (struct.new $Class
	(i64.const 0x0c)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.MAP (export "Class#MAP") (ref $Class) (struct.new $Class
	(i64.const 0x0d)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.EXCEPTION (export "Class#EXCEPTION") (ref $Class) (struct.new $Class
	(i64.const 0x0e)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.MAYBE (export "Class#MAYBE") (ref $Class) (struct.new $Class
	(i64.const 0x0f)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.NONE (export "Class#NONE") (ref $Class) (struct.new $Class
	(i64.const 0x10)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.SOME (export "Class#SOME") (ref $Class) (struct.new $Class
	(i64.const 0x11)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.RESULT (export "Class#RESULT") (ref $Class) (struct.new $Class
	(i64.const 0x12)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.FAIL (export "Class#FAIL") (ref $Class) (struct.new $Class
	(i64.const 0x13)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.OK (export "Class#OK") (ref $Class) (struct.new $Class
	(i64.const 0x14)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
(global $Class.FUNCTION (export "Class#FUNCTION") (ref $Class) (struct.new $Class
	(i64.const 0x15)
	(global.get $Class.CLASS)
	(ref.null $Dict)
))
