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
		(i32.const ${ 42 + 420 })
	`))
})



test('Compile file with simple expression, subtract.', () => {
	expect(new CodeGenerator('42 - 420').print()).toBe(boilerplate(`
		(i32.const ${ 42 + -420 })
	`))
})



test('Compile file with simple expression, divide.', () => {
	expect(new CodeGenerator('126 / 3').print()).toBe(boilerplate(`
		(i32.const ${ Math.trunc(126 / 3) })
	`))
	expect(new CodeGenerator('-126 / 3').print()).toBe(boilerplate(`
		(i32.const ${ Math.trunc(-126 / 3) })
	`))
	expect(new CodeGenerator('126 / -3').print()).toBe(boilerplate(`
		(i32.const ${ Math.trunc(126 / -3) })
	`))
	expect(new CodeGenerator('-126 / -3').print()).toBe(boilerplate(`
		(i32.const ${ Math.trunc(-126 / -3) })
	`))
})



test('Compile file with simple expression, indivisible.', () => {
	expect(new CodeGenerator('200 / 3').print()).toBe(boilerplate(`
		(i32.const ${ Math.trunc(200 / 3) })
	`))
	expect(new CodeGenerator('200 / -3').print()).toBe(boilerplate(`
		(i32.const ${ Math.trunc(200 / -3) })
	`))
	expect(new CodeGenerator('-200 / 3').print()).toBe(boilerplate(`
		(i32.const ${ Math.trunc(-200 / 3) })
	`))
	expect(new CodeGenerator('-200 / -3').print()).toBe(boilerplate(`
		(i32.const ${ Math.trunc(-200 / -3) })
	`))
})



test('Compile file with compound expression.', () => {
	expect(new CodeGenerator('42 ^ 2 * 420').print()).toBe(boilerplate(`
		(i32.const ${ (42 ** 2 * 420) % (2 ** 16) })
	`))
})



test('Compile file with compound expression, overflow.', () => {
	expect(new CodeGenerator('2 ^ 15 + 2 ^ 14').print()).toBe(boilerplate(`
		(i32.const ${ -(2 ** 14) })
	`))
})



test('Compile file with compound expression, underflow.', () => {
	expect(new CodeGenerator('-(2 ^ 14) - 2 ^ 15').print()).toBe(boilerplate(`
		(i32.const ${ 2 ** 14 })
	`))
})



test('Compile file with compound expression, grouping.', () => {
	expect(new CodeGenerator('-(5) ^ +(2 * 3)').print()).toBe(boilerplate(`
		(i32.const ${(-(5)) ** +(2 * 3)})
	`))
})
