const fs = require('fs')
const path = require('path')

const {default: Parser} = require('../build/class/Parser.class.js')



const boilerplate = (expected) => `
			(module
				${ fs.readFileSync(path.join(__dirname, '../src/exp.wat'), 'utf8') }
				(func (export "run") (result i32)
					${ expected }
				)
			)
		`



test('Compile empty file.', () => {
	const node = new Parser('').parse().decorate()
	expect(node.compile().print()).toBe(boilerplate(`nop`))
})



test('Compile file with single token.', () => {
	const outs = ['42', '+42', '-42'].map((src) => new Parser(src).parse().decorate().compile().print())
	expect(outs).toEqual([
		`i32.const 42`,
		`i32.const 42`,
		`i32.const -42`,
	].map(boilerplate))
})



test('Compile file with simple expression, add.', () => {
	const node = new Parser('42 + 420').parse().decorate()
	expect(node.compile().print()).toBe(boilerplate([
		`i32.const 42`,
		`i32.const 420`,
		`i32.add`,
	].join('\n')))
})



test('Compile file with simple expression, subtract.', () => {
	const node = new Parser('42 - 420').parse().decorate()
	expect(node.compile().print()).toBe(boilerplate([
		`i32.const 42`,
		`i32.const 420`,
		`i32.const -1`,
		`i32.xor`,
		`i32.const 1`,
		`i32.add`,
		`i32.add`,
	].join('\n')))
})



test('Compile file with compound expression.', () => {
	const node = new Parser('42 ^ 2 * 420').parse().decorate()
	expect(node.compile().print()).toBe(boilerplate([
		`i32.const 42`,
		`i32.const 2`,
		`call $exp`,
		`i32.const 420`,
		`i32.mul`,
	].join('\n')))
})



test('Compile file with compound expression, grouping.', () => {
	const node = new Parser('-(42) ^ +(2 * 420)').parse().decorate()
	expect(node.compile().print()).toBe(boilerplate([
		`i32.const 42`,
		`i32.const -1`,
		`i32.xor`,
		`i32.const 1`,
		`i32.add`,
		`i32.const 2`,
		`i32.const 420`,
		`i32.mul`,
		`call $exp`,
	].join('\n')))
})
