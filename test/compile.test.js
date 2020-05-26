const fs = require('fs')
const path = require('path')

const {default: Util} = require('../build/class/Util.class.js')
const {default: CodeGenerator} = require('../build/class/CodeGenerator.class.js')



const boilerplate = (expected) => `
			(module
				${ fs.readFileSync(path.join(__dirname, '../src/neg.wat'), 'utf8') }
				${ fs.readFileSync(path.join(__dirname, '../src/exp.wat'), 'utf8') }
				(func (export "run") (result i32)
					${ Util.dedent(expected).trim().replace(/\n\t+\(/g, ' \(').replace(/\n\t*\)/g, '\)') }
				)
			)
		`



test('Compile empty file.', () => {
	expect(new CodeGenerator('').print()).toBe(boilerplate(`(nop)`))
})



test('Compile file with single token.', () => {
	expect(['42', '+42', '-42'].map((src) => new CodeGenerator(src).print())).toEqual([
		`(i32.const 42)`,
		`(i32.const 42)`,
		`(i32.const -42)`,
	].map(boilerplate))
})



test('Compile file with simple expression, add.', () => {
	expect(new CodeGenerator('42 + 420').print()).toBe(boilerplate(`
		(i32.add
			(i32.const 42)
			(i32.const 420)
		)
	`))
})



test('Compile file with simple expression, subtract.', () => {
	expect(new CodeGenerator('42 - 420').print()).toBe(boilerplate(`
		(i32.add
			(i32.const 42)
			(call $neg (i32.const 420))
		)
	`))
})



test('Compile file with compound expression.', () => {
	expect(new CodeGenerator('42 ^ 2 * 420').print()).toBe(boilerplate(`
		(i32.mul
			(call $exp
				(i32.const 42)
				(i32.const 2)
			)
			(i32.const 420)
		)
	`))
})



test('Compile file with compound expression, grouping.', () => {
	expect(new CodeGenerator('-(42) ^ +(2 * 420)').print()).toBe(boilerplate(`
		(call $exp
			(call $neg (i32.const 42))
			(i32.mul
				(i32.const 2)
				(i32.const 420)
			)
		)
	`))
})
