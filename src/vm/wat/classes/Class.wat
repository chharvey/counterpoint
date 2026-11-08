(global $Class.CLASS (export "Class#CLASS") (ref $Class) (struct.new $Class
	(i64.const 0) ;; `Class` is the very first object — with ID 0
	(ref.null $Class)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))

(global $Class.NULL (export "Class#NULL") (ref $Class) (struct.new $Class
	(i64.const 1)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.BOOLEAN (export "Class#BOOLEAN") (ref $Class) (struct.new $Class
	(i64.const 2)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.SYMBOL (export "Class#SYMBOL") (ref $Class) (struct.new $Class
	(i64.const 3)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.INTEGER (export "Class#INTEGER") (ref $Class) (struct.new $Class
	(i64.const 4)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.NATURAL (export "Class#NATURAL") (ref $Class) (struct.new $Class
	(i64.const 5)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.FLOAT (export "Class#FLOAT") (ref $Class) (struct.new $Class
	(i64.const 6)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.STRING (export "Class#STRING") (ref $Class) (struct.new $Class
	(i64.const 7)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.OBJECT (export "Class#OBJECT") (ref $Class) (struct.new $Class
	(i64.const 8)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.LIST (export "Class#LIST") (ref $Class) (struct.new $Class
	(i64.const 9)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.DICT (export "Class#DICT") (ref $Class) (struct.new $Class
	(i64.const 10)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.SET (export "Class#SET") (ref $Class) (struct.new $Class
	(i64.const 11)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.MAP (export "Class#MAP") (ref $Class) (struct.new $Class
	(i64.const 12)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.EXCEPTION (export "Class#EXCEPTION") (ref $Class) (struct.new $Class
	(i64.const 13)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.MAYBE (export "Class#MAYBE") (ref $Class) (struct.new $Class
	(i64.const 14)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.NONE (export "Class#NONE") (ref $Class) (struct.new $Class
	(i64.const 15)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.SOME (export "Class#SOME") (ref $Class) (struct.new $Class
	(i64.const 16)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.RESULT (export "Class#RESULT") (ref $Class) (struct.new $Class
	(i64.const 17)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.FAIL (export "Class#FAIL") (ref $Class) (struct.new $Class
	(i64.const 18)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.OK (export "Class#OK") (ref $Class) (struct.new $Class
	(i64.const 19)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.FUNCTION (export "Class#FUNCTION") (ref $Class) (struct.new $Class
	(i64.const 20)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
