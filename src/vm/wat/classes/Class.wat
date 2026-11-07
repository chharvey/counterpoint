(global $Class.CLASS (ref $Class) (struct.new $Class
	(i64.const 0) ;; `Class` is the very first object — with ID 0
	(ref.null $Class)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.OBJECT (ref $Class) (struct.new $Class
	(i64.const 1)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.LIST (ref $Class) (struct.new $Class
	(i64.const 2)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.DICT (ref $Class) (struct.new $Class
	(i64.const 3)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
(global $Class.MAP (ref $Class) (struct.new $Class
	(i64.const 4)
	(global.get $Class.CLASS)
	(struct.new $Dict
		(i32.const 0)
		(array.new_default $DictInternal (i32.const 8))
	)
))
